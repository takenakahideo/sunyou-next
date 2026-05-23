'use client'

import { useEffect, useRef, useState } from 'react'
import { useGeminiEstimate, EstimateVoiceState, EstimateResult, ContactData } from '../hooks/useGeminiEstimate'

export function EstimateChatModal() {
  const [open, setOpen] = useState(false)
  const [submittedData, setSubmittedData] = useState<ContactData | null>(null)
  const [manualEditMode, setManualEditMode] = useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  const {
    voiceState,
    estimateResult, contactData,
    connect, disconnect, sendText, submitCompleted,
    suggestions, aiQuestion,
  } = useGeminiEstimate()


  useEffect(() => {
    const handler = () => { setOpen(true); connect() }
    window.addEventListener('openEstimate', handler)
    return () => window.removeEventListener('openEstimate', handler)
  }, [connect])

  function handleClose() {
    disconnect()
    setOpen(false)
    setSubmittedData(null)
    setManualEditMode(false)
  }

  function handleReconnect() {
    setSubmittedData(null)
    setManualEditMode(false)
    connect()
  }

  function handleManualEdit() {
    disconnect()
    setManualEditMode(true)
  }

  const submitGuardRef = useRef<boolean>(false)
  async function handleSubmit(data: ContactData) {
    // 二重送信ガード：すでに送信中・送信済みなら何もしない
    if (submitGuardRef.current || submittedData) return
    submitGuardRef.current = true
    try {
      const payload = {
        ...data,
        memo:         data.memo,
        estimatePest: estimateResult?.pest,
        estimateMin:  estimateResult?.min,
        estimateMax:  estimateResult?.max,
        building:     estimateResult?.building,
        area:         estimateResult?.area,
        age:          estimateResult?.age,
        renovation:   estimateResult?.renovation,
        duration:     estimateResult?.duration,
        history:      estimateResult?.history,
      }
      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (json.success) {
        setSubmittedData(data)
        submitCompleted()
      } else {
        submitGuardRef.current = false  // 失敗時はガード解除して再試行可
      }
    } catch {
      submitGuardRef.current = false
      alert('送信に失敗しました。もう一度お試しください。')
    }
  }

  if (!open) return null

  // ── 受付完了画面 ────────────────────────────────────────
  if (submittedData) {
    return (
      <Overlay onClose={handleClose}>
        <YuiHeader voiceState="done" onClose={handleClose} />
        <div style={scrollArea}>
          <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
            <div style={{ fontSize: 44, marginBottom: 8 }}>🎉</div>
            <div style={{ fontWeight: 900, fontSize: 17, color: '#1a3a6e', marginBottom: 6 }}>受付完了しました！</div>
            <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.8 }}>
              担当スタッフより折り返しご連絡いたします。<br />少しお待ちください。
            </div>
          </div>
          <ContactCard data={submittedData} estimatePest={estimateResult?.pest ?? null} />
          <button onClick={handleClose} style={closeBtnStyle}>閉じる</button>
        </div>
      </Overlay>
    )
  }

  // フロー判定：見積もり進行中 or 問い合わせ進行中
  const isEstimateFlow = !!(estimateResult || contactData.symptom)
  const isInquiryFlow  = !!contactData.memo && !isEstimateFlow
  const isConfirmPhase = isEstimateFlow

  // ── 切断・エラー画面 ─────────────────────────────────────
  const isDisconnected = voiceState === 'idle' || voiceState === 'error'
  if (isDisconnected && !isConfirmPhase && !isInquiryFlow) {
    return (
      <Overlay onClose={handleClose}>
        <YuiHeader voiceState={voiceState} onClose={handleClose} />
        <div style={scrollArea}>
          {estimateResult && <EstimateCard result={estimateResult} />}
          {(contactData.name || contactData.address || contactData.phone) && (
            <ContactCard data={contactData} estimatePest={null} />
          )}
          <div style={{ background: '#fff3cd', border: '1.5px solid #ffc107', borderRadius: 12, padding: '14px 16px', fontSize: 14, color: '#856404', lineHeight: 1.7 }}>
            ⚠️ 接続が切れました。再接続して会話を続けることができます。
          </div>
          <button
            onClick={handleReconnect}
            style={{ background: 'linear-gradient(135deg,#1a3a6e,#2a5cbf)', color: '#fff', border: 'none', borderRadius: 12, padding: '13px', fontWeight: 900, fontSize: 14, cursor: 'pointer', fontFamily: "'Noto Sans JP',sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
          >
            🔄 再接続する
          </button>
          <button onClick={handleClose} style={{ background: 'transparent', color: '#94a3b8', border: '1px solid #dde3f0', borderRadius: 12, padding: '10px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: "'Noto Sans JP',sans-serif" }}>
            閉じる
          </button>
        </div>
      </Overlay>
    )
  }

  // ── 通常会話画面 ─────────────────────────────────────────
  return (
    <Overlay onClose={handleClose}>
      <YuiHeader voiceState={voiceState} onClose={handleClose} />

      {/* 固定エリア：佐藤結衣の発言・見積もりカード（常に画面上部に残る） */}
      <div style={fixedArea}>
        {/* 佐藤結衣の発言テキスト */}
        {aiQuestion && !manualEditMode && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <img src="/uploads/ai-operator.png" alt="佐藤結衣" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', objectPosition: 'top center', flexShrink: 0 }} />
            <div style={{ background: '#fff', border: '1.5px solid #d4ddf8', borderRadius: '18px 18px 18px 4px', padding: '12px 16px', fontSize: 17, color: '#1a1a2e', fontWeight: 600, maxWidth: '82%', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', lineHeight: 1.65 }}>
              {aiQuestion}
            </div>
          </div>
        )}

        {/* 接続インジケータ */}
        {(voiceState === 'connecting' || voiceState === 'listening') && !aiQuestion && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
            {[0, 1, 2].map(i => (
              <span key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: '#94a3b8', animation: `ecmBounce 1.2s ${i * 0.2}s infinite ease-in-out`, display: 'inline-block' }} />
            ))}
          </div>
        )}

        {/* 仮見積もりカード */}
        {estimateResult && <EstimateCard result={estimateResult} />}

        {/* 切断時の警告 */}
        {isDisconnected && (isEstimateFlow || isInquiryFlow) && (
          <div style={{ background: '#fff3cd', border: '1.5px solid #ffc107', borderRadius: 12, padding: '12px 14px', fontSize: 13, color: '#856404', lineHeight: 1.6 }}>
            ⚠️ 接続が切れましたが、入力内容はそのまま送信できます。
          </div>
        )}
      </div>

      {/* スクロールエリア：フォーム部分のみ（縦に伸びる） */}
      <div ref={scrollRef} style={scrollArea}>
        {/* フローA：確認フォーム（最初から常時表示・徐々に自動入力） */}
        {isEstimateFlow && (
          <ConfirmForm
            contactData={contactData}
            estimateResult={estimateResult}
            onSubmit={handleSubmit}
            manualEditMode={manualEditMode}
            onManualEdit={handleManualEdit}
          />
        )}

        {/* フローB：受付内容カード＋送信 */}
        {isInquiryFlow && (
          <InquiryForm
            contactData={contactData}
            onSubmit={handleSubmit}
          />
        )}
      </div>

      <div style={{ padding: '14px 18px 18px', background: '#f4f6fb', borderTop: '1px solid #e8ecf4', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <MicButton voiceState={voiceState} />
        <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
          {voiceState === 'listening'  ? '聞いています — 話しかけてください' :
           voiceState === 'speaking'   ? '佐藤結衣が話しています...' :
           voiceState === 'connecting' ? '接続中...' : ''}
        </div>
      </div>

      <style>{`
        @keyframes ecmFadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes ecmSlideUp { from{opacity:0;transform:translateY(32px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes ecmBounce  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes ecmPulse   { 0%,100%{box-shadow:0 0 0 0 rgba(74,222,128,0.5)} 50%{box-shadow:0 0 0 12px rgba(74,222,128,0)} }
        @keyframes ecmPulseY  { 0%,100%{box-shadow:0 0 0 0 rgba(251,191,36,0.5)} 50%{box-shadow:0 0 0 12px rgba(251,191,36,0)} }
        @keyframes yuiRipple  { 0%{transform:translate(-50%,-50%) scale(0.5);opacity:1} 100%{transform:translate(-50%,-50%) scale(2.8);opacity:0} }
      `}</style>
    </Overlay>
  )
}

// ─── 確認・送信フォーム ────────────────────────────────────

function ConfirmForm({ contactData, estimateResult, onSubmit, manualEditMode, onManualEdit }: {
  contactData: ContactData
  estimateResult: EstimateResult | null
  onSubmit: (data: ContactData) => void
  manualEditMode: boolean
  onManualEdit: () => void
}) {
  const [form, setForm] = useState<ContactData>({ ...contactData })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setForm(prev => ({ ...prev, ...contactData }))
  }, [contactData])

  const set = (key: keyof ContactData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  async function handlePostalBlur() {
    const code = (form.postal ?? '').replace(/[^\d]/g, '')
    if (code.length !== 7) return
    try {
      const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${code}`)
      const json = await res.json()
      if (json.results?.[0]) {
        const r = json.results[0]
        setForm(prev => ({ ...prev, address: r.address1 + r.address2 + r.address3 }))
      }
    } catch { /* 失敗しても無視 */ }
  }

  async function handleClick() {
    if (!form.name || !form.phone) return
    setSubmitting(true)
    await onSubmit(form)
    setSubmitting(false)
  }

  return (
    <div style={{ background: '#fff', border: '1.5px solid #d4ddf8', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#1a3a6e', marginBottom: 10 }}>📋 内容確認・修正してください</div>
      {estimateResult && (
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8, padding: '6px 10px', background: '#f0f4ff', borderRadius: 8 }}>
          💡 {estimateResult.pest}：{Math.round(estimateResult.min / 10000)}万円〜{Math.round(estimateResult.max / 10000)}万円
        </div>
      )}
      {([
        { key: 'symptom' as const, label: '被害内容・ご用件', placeholder: '例：天井裏から足音がする' },
        { key: 'name'    as const, label: 'お名前（カタカナ）', placeholder: '例：タナカ タロウ' },
        { key: 'postal'  as const, label: '郵便番号（任意）', placeholder: '例：980-0000', onBlur: handlePostalBlur },
        { key: 'address' as const, label: 'ご住所（任意）', placeholder: '例：宮城県大崎市古川〇〇1-2-3 △△マンション101' },
        { key: 'phone'   as const, label: '電話番号', placeholder: '例：090-0000-0000' },
      ]).map(({ key, label, placeholder, onBlur }) => (
        <div key={key} style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 3, fontWeight: 600 }}>{label}</div>
          <input
            value={form[key] ?? ''}
            onChange={set(key)}
            onBlur={onBlur}
            placeholder={placeholder}
            style={{ width: '100%', border: '1.5px solid #d4ddf8', borderRadius: 8, padding: '8px 10px', fontSize: 13, fontFamily: "'Noto Sans JP',sans-serif", color: '#1a1a2e', boxSizing: 'border-box', outline: 'none' }}
          />
        </div>
      ))}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 3, fontWeight: 600 }}>備考・ご要望（任意）</div>
        <textarea
          value={form.memo ?? ''}
          onChange={e => setForm(prev => ({ ...prev, memo: e.target.value }))}
          placeholder="例：2時間後以降に電話希望、平日午前のみ対応可"
          rows={2}
          style={{ width: '100%', border: '1.5px solid #d4ddf8', borderRadius: 8, padding: '8px 10px', fontSize: 13, fontFamily: "'Noto Sans JP',sans-serif", color: '#1a1a2e', boxSizing: 'border-box', outline: 'none', resize: 'vertical' }}
        />
      </div>
      <button
        onClick={handleClick}
        disabled={submitting || !form.name || !form.phone}
        style={{ marginTop: 6, width: '100%', background: submitting ? '#94a3b8' : 'linear-gradient(135deg,#c0392b,#e74c3c)', color: '#fff', border: 'none', borderRadius: 10, padding: '13px', fontWeight: 900, fontSize: 15, cursor: submitting ? 'default' : 'pointer', fontFamily: "'Noto Sans JP',sans-serif" }}
      >
        {submitting ? '送信中...' : '✅ 送信する'}
      </button>
      {!manualEditMode && (
        <button
          onClick={onManualEdit}
          style={{ marginTop: 8, width: '100%', background: 'transparent', color: '#94a3b8', border: '1px solid #d4ddf8', borderRadius: 10, padding: '10px', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: "'Noto Sans JP',sans-serif" }}
        >
          ✏️ 音声を切って手動で編集する
        </button>
      )}
    </div>
  )
}

// ─── フローB（問い合わせ）用フォーム ──────────────────────

function InquiryForm({ contactData, onSubmit }: {
  contactData: ContactData
  onSubmit: (data: ContactData) => void
}) {
  const [form, setForm] = useState<ContactData>({ ...contactData })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setForm(prev => ({ ...prev, ...contactData }))
  }, [contactData])

  const set = (key: keyof ContactData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  async function handleClick() {
    if (!form.name || !form.phone) return
    setSubmitting(true)
    await onSubmit(form)
    setSubmitting(false)
  }

  return (
    <div style={{ background: '#fff', border: '1.5px solid #d4ddf8', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#1a3a6e', marginBottom: 10 }}>📋 お問い合わせ内容</div>
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 3, fontWeight: 600 }}>ご用件</div>
        <textarea
          value={form.memo ?? ''}
          onChange={set('memo')}
          placeholder="ご用件・ご質問内容"
          rows={2}
          style={{ width: '100%', border: '1.5px solid #d4ddf8', borderRadius: 8, padding: '8px 10px', fontSize: 13, fontFamily: "'Noto Sans JP',sans-serif", color: '#1a1a2e', boxSizing: 'border-box', outline: 'none', resize: 'vertical' }}
        />
      </div>
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 3, fontWeight: 600 }}>お名前（カタカナ）</div>
        <input
          value={form.name ?? ''}
          onChange={set('name')}
          placeholder="例：タナカ タロウ"
          style={{ width: '100%', border: '1.5px solid #d4ddf8', borderRadius: 8, padding: '8px 10px', fontSize: 13, fontFamily: "'Noto Sans JP',sans-serif", color: '#1a1a2e', boxSizing: 'border-box', outline: 'none' }}
        />
      </div>
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 3, fontWeight: 600 }}>電話番号</div>
        <input
          value={form.phone ?? ''}
          onChange={set('phone')}
          placeholder="例：090-0000-0000"
          style={{ width: '100%', border: '1.5px solid #d4ddf8', borderRadius: 8, padding: '8px 10px', fontSize: 13, fontFamily: "'Noto Sans JP',sans-serif", color: '#1a1a2e', boxSizing: 'border-box', outline: 'none' }}
        />
      </div>
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 3, fontWeight: 600 }}>ご住所（任意）</div>
        <input
          value={form.address ?? ''}
          onChange={set('address')}
          placeholder="例：宮城県大崎市古川○○1-2-3"
          style={{ width: '100%', border: '1.5px solid #d4ddf8', borderRadius: 8, padding: '8px 10px', fontSize: 13, fontFamily: "'Noto Sans JP',sans-serif", color: '#1a1a2e', boxSizing: 'border-box', outline: 'none' }}
        />
      </div>
      <button
        onClick={handleClick}
        disabled={submitting || !form.name || !form.phone}
        style={{ marginTop: 6, width: '100%', background: submitting ? '#94a3b8' : 'linear-gradient(135deg,#c0392b,#e74c3c)', color: '#fff', border: 'none', borderRadius: 10, padding: '13px', fontWeight: 900, fontSize: 15, cursor: submitting ? 'default' : 'pointer', fontFamily: "'Noto Sans JP',sans-serif" }}
      >
        {submitting ? '送信中...' : '✅ 送信する'}
      </button>
    </div>
  )
}

// ─── Styles ────────────────────────────────────────────────

const fixedArea: React.CSSProperties = {
  flexShrink: 0, padding: '16px 18px 8px',
  background: '#f4f6fb', display: 'flex', flexDirection: 'column', gap: 12,
  borderBottom: '1px solid #e8ecf4',
}
const scrollArea: React.CSSProperties = {
  flex: 1, overflowY: 'auto', padding: '12px 18px',
  background: '#f4f6fb', display: 'flex', flexDirection: 'column', gap: 12,
}
const closeBtnStyle: React.CSSProperties = {
  background: '#1a3a6e', color: '#fff', border: 'none', borderRadius: 12,
  padding: '13px', fontWeight: 900, fontSize: 14, cursor: 'pointer',
  fontFamily: "'Noto Sans JP',sans-serif", textAlign: 'center',
}

// ─── Sub components ────────────────────────────────────────

function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(8,16,40,0.85)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', zIndex: 9985, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: "'Noto Sans JP',sans-serif", animation: 'ecmFadeIn 0.25s ease-out' }}
    >
      <div style={{ background: '#f4f6fb', borderRadius: 24, width: '100%', maxWidth: 520, maxHeight: '93vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.5)', animation: 'ecmSlideUp 0.35s cubic-bezier(0.34,1.4,0.64,1)' }}>
        {children}
      </div>
    </div>
  )
}

function YuiHeader({ voiceState, onClose }: { voiceState: EstimateVoiceState | 'done'; onClose: () => void }) {
  const statusColor = voiceState === 'speaking' ? '#fbbf24' : voiceState === 'listening' ? '#4ade80' : voiceState === 'done' ? '#4ade80' : voiceState === 'error' || voiceState === 'idle' ? '#f87171' : '#94a3b8'
  const statusText  = voiceState === 'connecting' ? '接続中...' : voiceState === 'listening' ? '聞いています' : voiceState === 'speaking' ? '話しています...' : voiceState === 'done' ? '受付完了' : voiceState === 'error' ? 'エラー' : '接続が切れました'
  const rippleColor = voiceState === 'speaking' ? 'rgba(251,191,36,0.75)' : voiceState === 'listening' ? 'rgba(74,222,128,0.75)' : null
  const rippleSpeed = voiceState === 'speaking' ? '1.2s' : '1.8s'
  return (
    <div style={{ position: 'relative', height: 240, flexShrink: 0, overflow: 'hidden' }}>
      <img src="/uploads/ai-operator.png" alt="佐藤結衣" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 35%, rgba(8,16,50,0.95) 100%)' }} />
      {/* speaking/listening 時の顔まわり円形波紋エフェクト */}
      {rippleColor && [0, 1, 2].map(i => (
        <div key={i} style={{
          position: 'absolute', top: 78, left: '50%',
          width: 90, height: 90, borderRadius: '50%',
          border: `2.5px solid ${rippleColor}`,
          animation: `yuiRipple ${rippleSpeed} ${-(parseFloat(rippleSpeed) / 3) * (2 - i)}s ease-out infinite`,
          pointerEvents: 'none',
        }} />
      ))}
      <div style={{ position: 'absolute', top: 14, left: 16, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 20, padding: '5px 12px', color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', display: 'inline-block', background: statusColor, boxShadow: voiceState === 'listening' ? '0 0 6px #4ade80' : 'none' }} />
        {statusText}
      </div>
      <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', border: '1.5px solid rgba(255,255,255,0.3)', color: '#fff', width: 34, height: 34, borderRadius: '50%', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
      <div style={{ position: 'absolute', bottom: 14, left: 20, right: 20 }}>
        <div style={{ color: 'rgba(255,200,100,0.9)', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', marginBottom: 3 }}>✦ AI無料見積りシミュレーター ✦</div>
        <div style={{ color: '#fff', fontWeight: 900, fontSize: 19, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>AIオペレーター「佐藤結衣」</div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 3 }}>サンユー・ネクスト 無料見積り受付</div>
      </div>
    </div>
  )
}

function EstimateCard({ result }: { result: { min: number; max: number; pest: string } }) {
  return (
    <div style={{ background: 'linear-gradient(135deg,#102650,#1a3a6e)', borderRadius: 12, padding: '12px 16px', boxShadow: '0 4px 16px rgba(16,38,80,0.25)' }}>
      <div style={{ color: 'rgba(255,200,100,0.9)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 4 }}>{result.pest} ／ 簡易お見積り</div>
      <div style={{ color: '#fff', fontWeight: 900, fontSize: 24 }}>{Math.round(result.min / 10000)}万円 〜 {Math.round(result.max / 10000)}万円</div>
      <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, marginTop: 4 }}>※現地調査でより正確な金額をご提示します</div>
    </div>
  )
}


function ContactCard({ data, estimatePest }: { data: ContactData; estimatePest: string | null }) {
  const items = [
    estimatePest          && { label: '被害種類', value: estimatePest },
    data.symptom          && { label: '被害内容', value: data.symptom },
    data.name             && { label: 'お名前',   value: data.name },
    data.postal           && { label: '郵便番号', value: data.postal },
    data.address          && { label: 'ご住所',   value: data.address },
    data.phone            && { label: '電話番号', value: data.phone },
  ].filter(Boolean) as { label: string; value: string }[]
  if (items.length === 0) return null
  return (
    <div style={{ background: '#fff', border: '1.5px solid #d4ddf8', borderRadius: 12, padding: '12px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#1a3a6e', marginBottom: 8 }}>📋 受付内容</div>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: 10, fontSize: 13, marginBottom: 5, alignItems: 'center' }}>
          <span style={{ color: '#4ade80', fontSize: 14 }}>✓</span>
          <span style={{ color: '#6b7280', minWidth: 64 }}>{item.label}：</span>
          <span style={{ color: '#1a1a2e', fontWeight: 600 }}>{item.value}</span>
        </div>
      ))}
    </div>
  )
}

const AREA_LABEL_MAP: Record<string, string> = {
  '10坪以下':   '10坪以下（33㎡以下）',
  '11〜20坪':   '11〜20坪（36〜66㎡）',
  '21〜30坪':   '21〜30坪（69〜99㎡）',
  '31〜50坪':   '31〜50坪（102〜165㎡）',
  '51坪以上':   '51坪以上（168㎡〜）',
}

function SuggestionChip({ label, onTap }: { label: string; onTap: () => void }) {
  const displayLabel = AREA_LABEL_MAP[label] ?? label
  return (
    <button
      onClick={onTap}
      style={{ background: '#fff', border: '1.5px solid #c5d0e6', borderRadius: 999, padding: '8px 16px', fontSize: 13, color: '#1a3a6e', fontWeight: 600, cursor: 'pointer', fontFamily: "'Noto Sans JP',sans-serif", boxShadow: '0 1px 4px rgba(0,0,0,0.06)', transition: 'all 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.background = '#eef2ff'; e.currentTarget.style.borderColor = '#1a3a6e' }}
      onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#c5d0e6' }}
    >
      {displayLabel}
    </button>
  )
}

function MicButton({ voiceState }: { voiceState: EstimateVoiceState }) {
  const isListening = voiceState === 'listening'
  const isSpeaking  = voiceState === 'speaking'
  return (
    <div style={{ width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, transition: 'all 0.3s', cursor: 'default', background: isSpeaking ? 'linear-gradient(135deg,#d97706,#fbbf24)' : isListening ? 'linear-gradient(135deg,#16a34a,#4ade80)' : 'linear-gradient(135deg,#475569,#94a3b8)', boxShadow: isListening ? '0 4px 20px rgba(74,222,128,0.4)' : isSpeaking ? '0 4px 20px rgba(251,191,36,0.4)' : '0 4px 12px rgba(0,0,0,0.15)', animation: isListening ? 'ecmPulse 1.8s infinite' : isSpeaking ? 'ecmPulseY 1.2s infinite' : 'none' }}>
      🎤
    </div>
  )
}
