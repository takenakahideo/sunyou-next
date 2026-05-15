/**
 * PCMProcessor — AudioWorklet
 * 128フレーム/量子を1600サンプル（100ms @16kHz）に集約してから送信
 * Gemini Live APIの推奨チャンクサイズに合わせることで誤作動を防ぐ
 */
class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this._buf    = []
    this._len    = 0
    this._sumSq  = 0
  }

  process(inputs) {
    const ch = inputs[0]?.[0]
    if (!ch || ch.length === 0) return true

    const i16 = new Int16Array(ch.length)
    for (let i = 0; i < ch.length; i++) {
      const s = Math.max(-1, Math.min(1, ch[i]))
      i16[i] = s < 0 ? (s * 32768) : (s * 32767)
      this._sumSq += s * s
    }
    this._buf.push(i16)
    this._len += ch.length

    // 1600サンプル（100ms）溜まったら送信
    if (this._len >= 1600) {
      const combined = new Int16Array(this._len)
      let off = 0
      for (const b of this._buf) { combined.set(b, off); off += b.length }

      const rms = Math.sqrt(this._sumSq / this._len)
      this._buf   = []
      this._len   = 0
      this._sumSq = 0

      this.port.postMessage({ rms, buffer: combined.buffer }, [combined.buffer])
    }

    return true
  }
}

registerProcessor('pcm-processor', PCMProcessor)
