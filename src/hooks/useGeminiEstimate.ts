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
}

const PEST_CENTER: Record<string, number> = {
  hakubishin: 150000,
  nezumi:      80000,
  hachi:       28000,
  shiroari:   220000,
  konchu:      50000,
  tori:       100000,
}
const PEST_SPREAD: Record<string, number> = {
  hakubishin: 30000,
  nezumi:     15000,
  hachi:       8000,
  shiroari:   40000,
  konchu:     12000,
  tori:       20000,
}
const PEST_LABEL: Record<string, string> = {
  hakubishin: 'ハクビシン・タヌキ',
  nezumi:     'ネズミ',
  hachi:      'ハチ',
  shiroari:   'シロアリ',
  konchu:     '害虫全般',
  tori:       '鳥獣（コウモリ・鳩等）',
}
const BUILDING_MULT:   Record<string, number> = { house: 1.0, mansion: 0.85, store: 1.2, farm: 1.15, other: 1.0 }
const AREA_MULT:       Record<string, number> = { xsmall: 0.75, small: 0.85, medium: 1.0, large: 1.15, xlarge: 1.3 }
const AGE_MULT:        Record<string, number> = { new: 0.9, young: 1.0, old: 1.1, veryold: 1.25, unknown: 1.0 }
const RENOVATION_MULT: Record<string, number> = { none: 1.0, yes: 1.05, unknown: 1.0 }
const DURATION_MULT:   Record<string, number> = { week: 0.95, month: 1.0, quarter: 1.1, year: 1.2 }
const HISTORY_MULT:    Record<string, number> = { none: 1.0, self: 1.05, carpenter: 1.1, pro: 1.2 }

function calcEstimate(pest: string, building?: string, duration?: string, age?: string, renovation?: string, history?: string, area?: string): EstimateResult {
  const center = PEST_CENTER[pest] ?? 100000
  const spread = PEST_SPREAD[pest] ?? 20000
  const m = (BUILDING_MULT[building ?? 'house'] ?? 1.0)
    * (AREA_MULT[area ?? 'medium'] ?? 1.0)
    * (AGE_MULT[age ?? 'unknown'] ?? 1.0)
    * (RENOVATION_MULT[renovation ?? 'unknown'] ?? 1.0)
    * (DURATION_MULT[duration ?? 'month'] ?? 1.0)
    * (HISTORY_MULT[history ?? 'none'] ?? 1.0)
  return {
    min:  Math.round((center * m - spread) / 10000) * 10000,
    max:  Math.round((center * m + spread) / 10000) * 10000,
    pest: PEST_LABEL[pest] ?? pest,
  }
}

const PLAY_AHEAD    = 0.15
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

      const sendTool = (id: unknown, name: string, output: string) =>
        ws.send(JSON.stringify({ type: 'toolResponse', id, name, output }))

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
          const expectedEnd = nextPlayRef.current
          const poll = () => {
            if (!wsRef.current) return
            if (outCtx.currentTime >= expectedEnd && outCtx.currentTime >= nextPlayRef.current) {
              nextPlayRef.current = 0; isAITalkingRef.current = false
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

        if (msg.type === 'toolCall' && msg.name === 'show_choices') {
          const args = msg.args as { question: string; choices: string }
          setAiQuestion(args.question ?? '')
          setSuggestions(
            args.choices ? args.choices.split(',').map(s => s.trim()).filter(Boolean) : []
          )
          sendTool(msg.id, 'show_choices', 'ok')
          return
        }

        if (msg.type === 'toolCall' && msg.name === 'update_display') {
          const args = msg.args as ContactData
          contactBufferRef.current = { ...contactBufferRef.current, ...args }
          sendTool(msg.id, 'update_display', '表示更新済み'); return
        }

        if (msg.type === 'toolCall' && msg.name === 'finalize_estimate') {
          const args = msg.args as { pest?: string; building?: string; duration?: string; age?: string; renovation?: string; history?: string; area?: string }
          const result = {
            ...calcEstimate(args.pest ?? 'nezumi', args.building, args.duration, args.age, args.renovation, args.history, args.area),
            building: args.building, age: args.age, renovation: args.renovation,
            duration: args.duration, history: args.history, area: args.area,
          }
          setEstimateResult(result)
          const priceText = `${Math.round(result.min / 10000)}万円〜${Math.round(result.max / 10000)}万円`
          sendTool(msg.id, 'finalize_estimate', `お見積り金額：${priceText}（${result.pest}）`)
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
