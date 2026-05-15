'use client'

import { useCallback, useRef, useState } from 'react'

const VOICES: { id: string; label: string; note: string }[] = [
  { id: 'Aoede',        label: 'Aoede（現在）',  note: '温かい・ニュートラル' },
  { id: 'Leda',         label: 'Leda',           note: '明るい・若々しい' },
  { id: 'Despina',      label: 'Despina',        note: '柔らかい・やさしい' },
  { id: 'Kore',         label: 'Kore',           note: '温かい・落ち着き' },
  { id: 'Autonoe',      label: 'Autonoe',        note: '上品・透明感' },
  { id: 'Erinome',      label: 'Erinome',        note: '澄んだ・誠実' },
  { id: 'Laomedeia',    label: 'Laomedeia',      note: '優雅・ゆったり' },
  { id: 'Pulcherrima',  label: 'Pulcherrima',    note: '華やか・元気' },
  { id: 'Vindemiatrix', label: 'Vindemiatrix',   note: '穏やか・大人' },
  { id: 'Zephyr',       label: 'Zephyr',         note: '軽やか・爽やか' },
  { id: 'Puck',         label: 'Puck',           note: '明るい・活発' },
  { id: 'Charon',       label: 'Charon',         note: '深い・落ち着き' },
]

export default function VoicePreviewPage() {
  const [playing, setPlaying] = useState<string | null>(null)
  const wsRef    = useRef<WebSocket   | null>(null)
  const ctxRef   = useRef<AudioContext | null>(null)
  const nextRef  = useRef<number>(0)

  const stop = useCallback(() => {
    wsRef.current?.close(); wsRef.current = null
    if (ctxRef.current && ctxRef.current.state !== 'closed') ctxRef.current.close()
    ctxRef.current = null; nextRef.current = 0
    setPlaying(null)
  }, [])

  const play = useCallback((voice: string) => {
    if (playing) stop()
    setPlaying(voice)

    const ctx = new AudioContext({ sampleRate: 24000 })
    ctxRef.current = ctx
    nextRef.current = 0

    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${proto}//${window.location.host}/api/voice-preview?voice=${voice}`)
    wsRef.current = ws

    ws.onmessage = (evt) => {
      let msg: { type?: string; data?: string }
      try { msg = JSON.parse(evt.data as string) } catch { return }
      if (msg.type === 'audio' && msg.data) {
        const bin = atob(msg.data)
        const bytes = new Uint8Array(bin.length)
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
        const int16 = new Int16Array(bytes.buffer)
        const f32 = new Float32Array(int16.length)
        for (let i = 0; i < int16.length; i++) f32[i] = int16[i] / 32768
        const buf = ctx.createBuffer(1, f32.length, 24000)
        buf.copyToChannel(f32, 0)
        const src = ctx.createBufferSource()
        src.buffer = buf; src.connect(ctx.destination)
        const t = Math.max(ctx.currentTime + 0.1, nextRef.current)
        src.start(t); nextRef.current = t + buf.duration
      }
      if (msg.type === 'turnComplete') {
        setTimeout(() => stop(), Math.max(0, (nextRef.current - ctx.currentTime) * 1000 + 200))
      }
    }
    ws.onclose = () => { /* clean up handled by stop */ }
    ws.onerror = () => stop()
  }, [playing, stop])

  return (
    <main className="min-h-screen bg-neutral-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">佐藤結衣 声試聴</h1>
        <p className="text-sm text-neutral-600 mb-6">
          各ボタンを押すと、その声で「こんにちは、サンユー・ネクストの佐藤結衣です。本日はどんなご用件でしょうか」と挨拶します。
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {VOICES.map(v => (
            <button
              key={v.id}
              onClick={() => play(v.id)}
              disabled={playing !== null && playing !== v.id}
              className={`text-left p-4 rounded-lg border transition ${
                playing === v.id
                  ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-300'
                  : 'bg-white border-neutral-200 hover:border-amber-300 hover:bg-amber-50'
              } ${playing !== null && playing !== v.id ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <div className="font-bold text-neutral-900">
                {playing === v.id ? '🔊 ' : '▶ '} {v.label}
              </div>
              <div className="text-xs text-neutral-500 mt-1">{v.note}</div>
            </button>
          ))}
        </div>

        {playing && (
          <button
            onClick={stop}
            className="mt-6 w-full py-3 bg-neutral-800 text-white rounded-lg font-bold"
          >
            停止
          </button>
        )}
      </div>
    </main>
  )
}
