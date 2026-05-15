'use client'

import { useCallback, useRef, useState } from 'react'

export type EstimateVoiceState =
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'speaking'
  | 'done'
  | 'error'

export interface EstimateResult {
  min: number
  max: number
  pest: string
  building?: string
  area?: string
  age?: string
  renovation?: string
  duration?: string
  history?: string
}

export interface ContactData {
  symptom?: string
  name?: string
  postal?: string
  address?: string
  phone?: string
  memo?: string
}


const PLAY_AHEAD    = 0.30
const RMS_THRESHOLD = 0.003
type PlayRef = { current: number }

export function useGeminiEstimate() {
  const [voiceState,     setVoiceState]     = useState<EstimateVoiceState>('idle')
  const [estimateResult, setEstimateResult] = useState<EstimateResult | null>(null)
  const [contactData,    setContactData]    = useState<ContactData>({})
  const [inquiryResult,  setInquiryResult]  = useState<ContactData | null>(null)
  const [suggestions,    setSuggestions]    = useState<string[]>([])
  const [aiQuestion,     setAiQuestion]     = useState<string>('')

  const wsRef             = useRef<WebSocket | null>(null)
  const inCtxRef          = useRef<AudioContext | null>(null)
  const outCtxRef         = useRef<AudioContext | null>(null)
  const streamRef         = useRef<MediaStream | null>(null)
  const workletRef        = useRef<AudioWorkletNode | null>(null)
  const srcRef            = useRef<MediaStreamAudioSourceNode | null>(null)
  const nextPlayRef       = useRef<number>(0) as PlayRef
  const isAITalkingRef    = useRef<boolean>(false)
  const contactBufferRef  = useRef<ContactData>({})
  const isSubmittedRef    = useRef<boolean>(false)

  const cleanup = useCallback(() => {
    try {
      workletRef.current?.port.close()
      workletRef.current?.disconnect()
      srcRef.current?.disconnect()
      streamRef.current?.getTracks().forEach(t => t.stop())
      if (inCtxRef.current?.state  !== 'closed') inCtxRef.current?.close()
      if (outCtxRef.current?.state !== 'closed') outCtxRef.current?.close()
    } catch { /* ignore */ }
    workletRef.current = null; srcRef.current = null; streamRef.current = null
    inCtxRef.current = null; outCtxRef.current = null
    nextPlayRef.current = 0; isAITalkingRef.current = false
  }, [])

  const disconnect = useCallback(() => {
    wsRef.current?.close(); wsRef.current = null
    cleanup(); setVoiceState('idle')
  }, [cleanup])

  const sendText = useCallback((text: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'text', text }))
    }
  }, [])

  const submitCompleted = useCallback(() => {
    isSubmittedRef.current = true
    setVoiceState('done')
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'text',
        text: '（受付が完了しました。「受付を完了いたしました。担当者から数日以内にご連絡いたします。ありがとうございました」とお伝えください）',
      }))
    }
  }, [])

  const connect = useCallback(async () => {
    if (wsRef.current !== null) return

    setVoiceState('connecting')
    setEstimateResult(null); setContactData({}); setInquiryResult(null)
    setSuggestions([]); setAiQuestion('')
    contactBufferRef.current = {}
    isSubmittedRef.current = false

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: { ideal: 1 }, sampleRate: { ideal: 16000 },
                 echoCancellation: { ideal: true }, noiseSuppression: { ideal: true }, autoGainControl: { ideal: true } },
      })
      streamRef.current = stream

      const inCtx  = new AudioContext({ sampleRate: 16000 })
      const outCtx = new AudioContext({ sampleRate: 24000 })
      if (inCtx.state  === 'suspended') await inCtx.resume()
      if (outCtx.state === 'suspended') await outCtx.resume()
      inCtxRef.current = inCtx; outCtxRef.current = outCtx; isAITalkingRef.current = false

      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const ws = new WebSocket(`${proto}//${window.location.host}/api/gemini-estimate`)
      wsRef.current = ws

      ws.onmessage = async (evt) => {
        let msg: Record<string, unknown>
        try { msg = JSON.parse(evt.data as string) } catch { return }

        if (msg.type === 'ready') {
          setVoiceState('listening')
          await startCapture(inCtx, stream, ws, workletRef, srcRef, isAITalkingRef)
          return
        }
        if (msg.type === 'audio') {
          isAITalkingRef.current = true; setVoiceState('speaking')
          playChunk(outCtx, msg.data as string, nextPlayRef); return
        }
        if (msg.type === 'turnComplete') {
          const estimateReveal = msg.estimateReveal as EstimateResult | undefined
          const expectedEnd = nextPlayRef.current
          const poll = () => {
            if (!wsRef.current) return
            if (outCtx.currentTime >= expectedEnd && outCtx.currentTime >= nextPlayRef.current) {
              nextPlayRef.current = 0; isAITalkingRef.current = false
              if (estimateReveal) setEstimateResult(estimateReveal)
              setContactData(prev => ({ ...prev, ...contactBufferRef.current }))
              if (isSubmittedRef.current) {
                // 送信完了の挨拶を話し終わったら切断
                wsRef.current?.close(); wsRef.current = null; cleanup()
              } else if (wsRef.current?.readyState === WebSocket.OPEN) {
                setVoiceState(s => s === 'done' ? 'done' : 'listening')
              }
            } else setTimeout(poll, 50)
          }
          setTimeout(poll, 150); return
        }

        if (msg.type === 'uiUpdate') {
          const args = msg.args as {
            question?: string; choices?: string
            symptom?: string; name?: string; postal?: string; address?: string; phone?: string; memo?: string
            building?: string; area?: string; age?: string; renovation?: string; duration?: string; history?: string
          }
          const estimateReady  = msg.estimateReady  as boolean | undefined
          const estimateResult = msg.estimateResult as { min: number; max: number; pest: string } | undefined
          const contactState   = msg.contactState   as { name?: string; address?: string; phone?: string } | undefined

          if (args.question !== undefined) setAiQuestion(args.question)
          setSuggestions(args.choices ? args.choices.split(',').map(s => s.trim()).filter(Boolean) : [])

          const contactUpdate: Partial<ContactData> = {}
          if (args.symptom !== undefined) contactUpdate.symptom = args.symptom
          if (args.memo    !== undefined) contactUpdate.memo    = args.memo
          if (args.postal  !== undefined && args.postal !== 'unknown') contactUpdate.postal = args.postal
          if (contactState?.name)    contactUpdate.name    = contactState.name
          if (contactState?.address) contactUpdate.address = contactState.address
          if (contactState?.phone)   contactUpdate.phone   = contactState.phone
          if (Object.keys(contactUpdate).length > 0) {
            contactBufferRef.current = { ...contactBufferRef.current, ...contactUpdate }
          }

          if (estimateReady && estimateResult) {
            setEstimateResult({
              ...estimateResult,
              building: args.building, area: args.area, age: args.age,
              renovation: args.renovation, duration: args.duration, history: args.history,
            })
          }
          return
        }

        if (msg.type === 'error') {
          console.error('[Gemini Estimate]', msg.message)
          setVoiceState('error'); cleanup()
        }
      }

      ws.onerror = () => { setVoiceState('error'); cleanup() }
      ws.onclose = () => {
        cleanup()
        setVoiceState(s => (s === 'done' ? 'done' : 'idle'))
      }
    } catch (err) {
      console.error('[Gemini Estimate] 接続エラー:', err)
      setVoiceState('error'); wsRef.current = null; cleanup()
    }
  }, [cleanup])

  return { voiceState, estimateResult, contactData, inquiryResult, connect, disconnect, sendText, submitCompleted, suggestions, aiQuestion, setInquiryResult }
}

// ─── Audio utilities ───────────────────────────────────────

async function startCapture(
  ctx: AudioContext, stream: MediaStream, ws: WebSocket,
  workletRef: { current: AudioWorkletNode | null },
  srcRef:     { current: MediaStreamAudioSourceNode | null },
  isAITalkingRef: { current: boolean },
) {
  await ctx.audioWorklet.addModule('/pcm-processor.js')
  const src    = ctx.createMediaStreamSource(stream)
  const worklet = new AudioWorkletNode(ctx, 'pcm-processor')
  worklet.port.onmessage = (evt: MessageEvent<{ rms: number; buffer: ArrayBuffer }>) => {
    if (ws.readyState !== WebSocket.OPEN) return
    const data = (isAITalkingRef.current || evt.data.rms < RMS_THRESHOLD)
      ? new Int16Array(1600).buffer : evt.data.buffer
    ws.send(JSON.stringify({ type: 'audio', data: bufToBase64(data) }))
  }
  src.connect(worklet)
  workletRef.current = worklet; srcRef.current = src
}

function playChunk(ctx: AudioContext, b64: string, nextRef: PlayRef) {
  const int16 = base64ToInt16(b64)
  const f32   = new Float32Array(int16.length)
  for (let i = 0; i < int16.length; i++) f32[i] = int16[i] / 32768
  const buf = ctx.createBuffer(1, f32.length, 24000)
  buf.copyToChannel(f32, 0)
  const src = ctx.createBufferSource()
  src.buffer = buf; src.connect(ctx.destination)
  const t = Math.max(ctx.currentTime + PLAY_AHEAD, nextRef.current)
  src.start(t); nextRef.current = t + buf.duration
}

function bufToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf); let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin)
}

function base64ToInt16(b64: string): Int16Array {
  const bin = atob(b64); const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new Int16Array(bytes.buffer)
}
