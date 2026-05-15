'use client'

import { useCallback, useRef, useState } from 'react'

export type VoiceState =
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'speaking'
  | 'submitting'
  | 'done'
  | 'error'

export interface InquiryData {
  symptom: string
  name: string
  address: string
  phone: string
}

type PlayRef = { current: number }

const PLAY_AHEAD = 0.15
const RMS_THRESHOLD = 0.003

export function useGeminiLive() {
  const [voiceState, setVoiceState]       = useState<VoiceState>('idle')
  const [inquiryResult, setInquiryResult] = useState<InquiryData | null>(null)
  const [displayData, setDisplayData]     = useState<Partial<InquiryData>>({})

  const wsRef          = useRef<WebSocket | null>(null)
  const inCtxRef       = useRef<AudioContext | null>(null)
  const outCtxRef      = useRef<AudioContext | null>(null)
  const streamRef      = useRef<MediaStream | null>(null)
  const workletRef     = useRef<AudioWorkletNode | null>(null)
  const srcRef         = useRef<MediaStreamAudioSourceNode | null>(null)
  const nextPlayRef    = useRef<number>(0) as PlayRef
  const isAITalkingRef = useRef<boolean>(false)

  const cleanup = useCallback(() => {
    try {
      workletRef.current?.port.close()
      workletRef.current?.disconnect()
      srcRef.current?.disconnect()
      streamRef.current?.getTracks().forEach(t => t.stop())
      if (inCtxRef.current?.state  !== 'closed') inCtxRef.current?.close()
      if (outCtxRef.current?.state !== 'closed') outCtxRef.current?.close()
    } catch { /* ignore */ }
    workletRef.current     = null
    srcRef.current         = null
    streamRef.current      = null
    inCtxRef.current       = null
    outCtxRef.current      = null
    nextPlayRef.current    = 0
    isAITalkingRef.current = false
  }, [])

  const disconnect = useCallback(() => {
    wsRef.current?.close()
    wsRef.current = null
    cleanup()
    setVoiceState('idle')
    setInquiryResult(null)
    setDisplayData({})
  }, [cleanup])

  const connect = useCallback(async () => {
    setVoiceState('connecting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount:     { ideal: 1 },
          sampleRate:       { ideal: 16000 },
          echoCancellation: { ideal: true },
          noiseSuppression: { ideal: true },
          autoGainControl:  { ideal: true },
        },
      })
      streamRef.current = stream

      const inCtx  = new AudioContext({ sampleRate: 16000 })
      const outCtx = new AudioContext({ sampleRate: 24000 })
      if (inCtx.state  === 'suspended') await inCtx.resume()
      if (outCtx.state === 'suspended') await outCtx.resume()
      inCtxRef.current       = inCtx
      outCtxRef.current      = outCtx
      isAITalkingRef.current = false

      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const ws = new WebSocket(`${proto}//${window.location.host}/api/gemini-live`)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('[Gemini Live] WebSocket 接続完了 — Gemini セッション初期化中...')
      }

      ws.onmessage = async (evt) => {
        let msg: Record<string, unknown>
        try { msg = JSON.parse(evt.data as string) } catch { return }

        if (msg.type === 'ready') {
          setVoiceState('listening')
          await startCapture(inCtx, stream, ws, workletRef, srcRef, isAITalkingRef)
          return
        }

        if (msg.type === 'audio') {
          isAITalkingRef.current = true
          setVoiceState('speaking')
          playChunk(outCtx, msg.data as string, nextPlayRef)
          return
        }

        if (msg.type === 'turnComplete') {
          // ポーリングで再生終了を待つ（in-flightチャンクにも対応）
          const expectedEnd = nextPlayRef.current
          const poll = () => {
            if (!wsRef.current) return
            // expectedEnd と最新 nextPlayRef 両方を過ぎていれば安全に解除
            if (
              outCtx.currentTime >= expectedEnd &&
              outCtx.currentTime >= nextPlayRef.current
            ) {
              nextPlayRef.current    = 0
              isAITalkingRef.current = false
              if (wsRef.current?.readyState === WebSocket.OPEN) {
                setVoiceState('listening')
              }
            } else {
              setTimeout(poll, 50)
            }
          }
          setTimeout(poll, 150) // 150ms待ってからポーリング開始（in-flight到着猶予）
          return
        }

        if (msg.type === 'toolCall' && msg.name === 'update_display') {
          const args   = msg.args as Partial<InquiryData>
          const callId = msg.id as string
          setDisplayData(prev => ({ ...prev, ...args }))
          ws.send(JSON.stringify({
            type:   'toolResponse',
            id:     callId,
            name:   'update_display',
            output: '表示更新済み。',
          }))
          return
        }

        if (msg.type === 'toolCall' && msg.name === 'submit_inquiry') {
          const args   = msg.args as InquiryData
          const callId = msg.id  as string
          setVoiceState('submitting')
          try {
            const res  = await fetch('/api/inquiry', {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              body:    JSON.stringify(args),
            })
            const json = await res.json()
            if (json.success) {
              setInquiryResult(args)
              setVoiceState('done')
              ws.send(JSON.stringify({
                type:   'toolResponse',
                id:     callId,
                name:   'submit_inquiry',
                output: '登録完了。',
              }))
            }
          } catch {
            setVoiceState('listening')
            ws.send(JSON.stringify({
              type:   'toolResponse',
              id:     callId,
              name:   'submit_inquiry',
              output: '登録に失敗しました。',
            }))
          }
          return
        }

        if (msg.type === 'error') {
          console.error('[Gemini Live]', msg.message)
          setVoiceState('error')
          cleanup()
        }
      }

      ws.onerror = (evt) => {
        console.error('[Client] ❌ WebSocket エラー:', evt)
        setVoiceState('error')
        cleanup()
      }
      ws.onclose = (evt) => {
        console.warn(`[Client] WebSocket 切断 — code: ${evt.code}, reason: "${evt.reason || '(なし)'}", wasClean: ${evt.wasClean}`)
        cleanup()
        setVoiceState(s => (s === 'done' ? 'done' : 'idle'))
      }

    } catch (err) {
      console.error('[Gemini Live] 接続エラー:', err)
      setVoiceState('error')
      cleanup()
    }
  }, [cleanup])

  return { voiceState, inquiryResult, displayData, connect, disconnect }
}

// ─── Audio utilities ──────────────────────────────────────

async function startCapture(
  ctx:            AudioContext,
  stream:         MediaStream,
  ws:             WebSocket,
  workletRef:     { current: AudioWorkletNode | null },
  srcRef:         { current: MediaStreamAudioSourceNode | null },
  isAITalkingRef: { current: boolean },
) {
  await ctx.audioWorklet.addModule('/pcm-processor.js')

  const src    = ctx.createMediaStreamSource(stream)
  const worklet = new AudioWorkletNode(ctx, 'pcm-processor')

  worklet.port.onmessage = (evt: MessageEvent<{ rms: number; buffer: ArrayBuffer }>) => {
    if (ws.readyState !== WebSocket.OPEN) return

    let data: ArrayBuffer
    if (isAITalkingRef.current || evt.data.rms < RMS_THRESHOLD) {
      // AI発話中 or 無音: 無音PCM（1600サンプル）で接続維持
      data = new Int16Array(1600).buffer
    } else {
      data = evt.data.buffer
    }

    ws.send(JSON.stringify({
      type: 'audio',
      data: bufToBase64(data),
    }))
  }

  // destination に繋がない（マイク音がスピーカーに漏れない）
  src.connect(worklet)

  workletRef.current = worklet
  srcRef.current     = src
}

function playChunk(ctx: AudioContext, b64: string, nextRef: PlayRef) {
  const int16 = base64ToInt16(b64)
  const f32   = new Float32Array(int16.length)
  for (let i = 0; i < int16.length; i++) f32[i] = int16[i] / 32768
  const buf = ctx.createBuffer(1, f32.length, 24000)
  buf.copyToChannel(f32, 0)
  const src = ctx.createBufferSource()
  src.buffer = buf
  src.connect(ctx.destination)
  const t = Math.max(ctx.currentTime + PLAY_AHEAD, nextRef.current)
  src.start(t)
  nextRef.current = t + buf.duration
}

function bufToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin)
}

function base64ToInt16(b64: string): Int16Array {
  const bin   = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Int16Array(bytes.buffer)
}
