'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageCircle } from 'lucide-react'
import { EstimateChatModal } from '@/components/EstimateChatModal'

// ─── 被害写真スライダー ───────────────────────────────────

const SLIDES = [
  '/uploads/damage-1.png',
  '/uploads/damage-2.png',
  '/uploads/damage-3.png',
  '/uploads/damage-4.png',
]

function MangaSlider() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setCurrent(c => (c + 1) % SLIDES.length), 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', height: 360 }}>
      {SLIDES.map((src, i) => (
        <div key={src} style={{ position: 'absolute', inset: 0, opacity: i === current ? 1 : 0, transition: 'opacity 0.8s ease-in-out', zIndex: i === current ? 2 : 1 }}>
          <img src={src} style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', display: 'block', background: '#000' }} alt={`ハクビシン被害 ${i + 1}`} />
        </div>
      ))}
      <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6, zIndex: 10 }}>
        {SLIDES.map((_, i) => (
          <span key={i} onClick={() => setCurrent(i)} style={{ width: 9, height: 9, borderRadius: '50%', background: i === current ? '#f5821f' : 'rgba(255,255,255,0.4)', display: 'inline-block', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.5)' }} />
        ))}
      </div>
    </div>
  )
}

// ─── メインページ ─────────────────────────────────────────

export default function SanyuNextPage() {
  return (
    <>
      {/* ヘッダー */}
      <header className="site-header">
        <div className="header-top">
          <div className="logo-wrap">
            <img src="/uploads/logo-main.png" alt="SunYou Next サンユー・ネクスト LLC" />
            <div className="logo-tagline" style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)' }}>大崎市で創業40年。信頼と実績。</span>
              <span style={{ fontSize: 26, fontWeight: 900, color: '#fff', lineHeight: 1.25, letterSpacing: '0.01em' }}>
                「三友薬品消毒」が<span style={{ color: '#ffa04a' }}>「サンユー・ネクスト」</span>
              </span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', textAlign: 'right' }}>と業務提携いたしました！</span>
            </div>
          </div>
          <div id="headerAICard" onClick={() => { const el = document.getElementById('ai'); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 130, behavior: 'smooth' }) }} style={{ display: 'flex', alignItems: 'stretch', gap: 0, background: 'linear-gradient(135deg,#102650,#1a3a6e)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 16px rgba(16,38,80,0.5)', cursor: 'pointer', border: '2px solid rgba(255,255,255,0.25)' }}>
            <div style={{ width: 64, flexShrink: 0, overflow: 'hidden' }}>
              <img src="/uploads/ai-operator.png" alt="佐藤結衣" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', display: 'block' }} />
            </div>
            <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3 }}>
              <div style={{ background: 'rgba(255,255,255,0.25)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, display: 'inline-block', width: 'fit-content', letterSpacing: '0.05em' }}>🕐 24時間365日受付</div>
              <div style={{ color: '#fff', fontWeight: 900, fontSize: 15, lineHeight: 1.35 }}>AIオペレーター<br />佐藤結衣</div>
              <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12, lineHeight: 1.4 }}>受付は私がいたします。</div>
            </div>
          </div>
        </div>
        <nav className="header-nav">
          <ul>
            <li><a href="#services">サービス一覧</a></li>
            <li><a href="#hakubishin">ハクビシン被害</a></li>
            <li><a href="#ai">AI無料相談</a></li>
            <li><a href="#reviews">お客様の声</a></li>
            <li><a href="#process">ご依頼の流れ</a></li>
            <li><a href="/faq">よくある質問</a></li>
            <li><a href="#ai">お問い合わせ</a></li>
          </ul>
        </nav>
      </header>

      {/* ヒーロー */}
      <section className="hero">
        <div className="hero-bg-img" />
        <div className="hero-bg-overlay" />
        <div className="hero-inner">

          {/* 左列 */}
          <div style={{ display: 'grid', gridTemplateRows: 'auto auto', gap: 24, alignContent: 'space-between' }}>
            <div>
              <div className="hero-badge" style={{ marginBottom: 18, fontSize: 25, padding: '8px 20px' }}>大崎市・宮城県全域 対応</div>
              <div style={{ fontFamily: "'Noto Serif JP',serif", fontSize: 21, fontWeight: 600, color: '#fff', lineHeight: 2.1, borderLeft: '4px solid var(--orange)', paddingLeft: 20, textShadow: '0 2px 10px rgba(0,0,0,0.9)' }}>
                駆除して終わり、ではありません。<br />
                <strong style={{ fontSize: 24 }}>大崎で40年。</strong>万が一の再発にも、<br />
                最後まで誠実に向き合い続ける。<br />
                それが地元の「三友薬品消毒」の<br />
                プライドです。
              </div>
            </div>

            {/* 施工員カード */}
            <div style={{ width: '75%', borderRadius: 14, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.6)', border: '2px solid rgba(255,255,255,0.25)', position: 'relative' }}>
              <img src="/uploads/workers.png" alt="施工員" style={{ width: '100%', display: 'block', height: 330, objectFit: 'cover', objectPosition: 'top' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 10%, rgba(10,22,50,0.75) 42%, rgba(10,22,50,0.97) 100%)', display: 'flex', alignItems: 'flex-end', padding: '24px 26px' }}>
                <div>
                  <div style={{ color: '#fff', fontFamily: "'Noto Serif JP',serif", fontSize: 20, fontWeight: 700, lineHeight: 1.8, textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
                    明瞭な会計を心がけています。<br />
                    <span style={{ color: 'var(--orange-light)', fontSize: 22, fontWeight: 900 }}>私たちにお任せください！</span>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', marginTop: 12, paddingTop: 12 }}>
                    <p style={{ color: 'rgba(255,255,255,0.92)', fontSize: 15, lineHeight: 1.9, margin: 0, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
                      有名な全国チェーン業者に依頼すると、高額になるケースも少なくありません。中には、<strong style={{ color: '#fff' }}>その場で契約しないと割引が効かない</strong>と迫る業者もいます。
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.92)', fontSize: 15, lineHeight: 1.9, margin: '8px 0 0', textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
                      私たちは大崎市で40年、地元のお客様と向き合ってきました。<strong style={{ color: 'var(--orange-light)' }}>他社の見積りを持参してのご相談も大歓迎です。</strong>その場での契約も一切不要。まず気軽に話してみてください。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 右列：AIオペレーターカード（24H凝縮版） */}
          <div style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '2px solid rgba(255,255,255,0.25)', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%' }}>

            {/* 画像エリア */}
            <div style={{ position: 'relative', flex: 1, overflow: 'hidden', minHeight: 180 }}>
              <img src="/uploads/ai-operator.png" alt="佐藤結衣" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 50%, rgba(10,22,50,0.95) 100%)' }} />
              {/* 点滅バッジ */}
              <div className="ai-image-badge">🟢 オンライン受付中</div>
              {/* 画像下部オーバーレイ */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 16px 14px', textAlign: 'center' }}>
                <div style={{ color: 'var(--orange-light)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', marginBottom: 5 }}>✦ 24H AI CONSULTATION ✦</div>
                <div style={{ color: '#fff', fontWeight: 900, fontSize: 20, lineHeight: 1.35 }}>AIオペレーター<br />「佐藤結衣」</div>
                <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 4 }}>深夜でも、休日でも即時対応します</div>
              </div>
            </div>

            {/* 下部：特徴チップ＋ボタン */}
            <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* フィーチャーリスト */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 10px' }}>
                {[
                  { icon: '🕐', text: '24時間・365日対応' },
                  { icon: '🆓', text: '完全無料・登録不要' },
                  { icon: '📋', text: '症状の自動判断・記録' },
                ].map(f => (
                  <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <span style={{ fontSize: 16, flexShrink: 0, opacity: 0.9 }}>{f.icon}</span>
                    <span style={{ color: 'rgba(255,255,255,0.95)', fontSize: 14, fontWeight: 700, letterSpacing: '0.02em' }}>{f.text}</span>
                  </div>
                ))}
              </div>
              {/* ボタン */}
              <button onClick={() => window.dispatchEvent(new CustomEvent('openEstimate', {}))} className="yui-call-btn" style={{ marginTop: 6 }}>
                <MessageCircle size={20} color="#fff" strokeWidth={2.2} style={{ flexShrink: 0 }} />
                <div className="yui-call-text">
                  <div className="yui-call-main">佐藤結衣に<br />相談する</div>
                  <div className="yui-call-sub"><span className="yui-live-dot" /> 無料・即時応答</div>
                </div>
              </button>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', textAlign: 'center', lineHeight: 1.6, margin: '4px 0 0' }}>
                🔒 音声はGoogle Gemini AIで処理されます。<a href="/privacy" style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'underline' }}>プライバシーポリシー</a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ハクビシン被害スライダー */}
      <div className="manga-section" id="hakubishin">
        <div className="manga-inner">
          <div className="section-title">
            <span className="en" style={{ textAlign: 'center', display: 'block' }}>Case Study</span>
            <h2 style={{ color: 'var(--navy)' }}>こんな症状が出たら<br />ハクビシンかもしれません</h2>
          </div>
          <div className="manga-grid">
            <div className="manga-img">
              <MangaSlider />
            </div>
            <div className="manga-content">
              <h3>「天井から音がする…」<br />放置すると取り返しのつかない事態に</h3>
              <p>ハクビシンは一度住み着くと、天井裏に大量の糞尿を蓄積します。悪臭・シミだけでなく、天井の腐食・崩壊につながることも。早期発見・早期対応が被害を最小限に抑えます。</p>
              <ul className="symptom-list">
                {['天井裏から足音・鳴き声がする', '天井にシミや黄ばみが広がっている', '屋根裏から強い悪臭がする', '外壁や屋根に侵入口らしき穴がある', '庭や畑の農作物が荒らされている'].map(s => <li key={s}>{s}</li>)}
              </ul>
            </div>
          </div>
          <div className="manga-grid" style={{ marginTop: 40 }}>
            <div className="manga-content">
              <h3>専門家による現地調査で<br />被害の全容を確認します</h3>
              <p>弊社スタッフが屋根裏・天井裏に直接入り、ハクビシンの侵入経路・糞尿の状況・被害範囲を詳しく調査。調査報告書と見積書を無料で提出します。</p>
              <ul className="symptom-list">
                {['侵入口の特定・閉塞工事', '糞尿の除去・消毒・消臭処理', '再発防止の忌避剤設置', '施工後の定期アフターフォロー'].map(s => <li key={s}>{s}</li>)}
              </ul>
            </div>
            <div className="manga-img">
              <img src="/uploads/damage-main.png" alt="ハクビシンの痕跡調査" />
            </div>
          </div>
        </div>
      </div>

      {/* AIセクション */}
      <div className="ai-section" id="ai">
        <div className="ai-inner" style={{ alignItems: 'stretch' }}>
          <div className="ai-content" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="section-title">
              <span className="en">24H AI Consultation</span>
              <h2>深夜でも、休日でも<br />AIが即時対応します</h2>
            </div>
            <p>お気軽にご相談ください。AIオペレーターの「佐藤結衣」が症状をお伺いいたします。人間と同じようにお答えいたします。</p>
            <div className="ai-features" style={{ marginTop: 'auto', marginBottom: 0 }}>
              {[
                { icon: '🕐', title: '24時間・365日対応', desc: '深夜・休日・年末年始も受付。緊急の場合も安心です。' },
                { icon: '🆓', title: '完全無料・登録不要', desc: '個人情報の登録なしでも仮のお見積りを作成します。（本格的にご依頼される場合は無料で現地調査を行い、状況に合わせて正式なお見積りをお出しします。その際にお断りになられても大丈夫です）' },
                { icon: '📋', title: '症状の自動判断・記録', desc: 'チャット内容は自動で台帳へ記録。スムーズな施工につながります。' },
              ].map(f => (
                <div key={f.title} className="ai-feature">
                  <div className="ai-feature-icon">{f.icon}</div>
                  <div className="ai-feature-text"><strong>{f.title}</strong>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
            <div className="ai-image-wrap" style={{ flex: 1, minHeight: 0 }}>
              <img src="/uploads/ai-operator.png" alt="AIオペレーター佐藤結衣" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
              <div className="ai-image-badge">🟢 オンライン受付中</div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent,rgba(16,38,80,0.9))', padding: '24px 20px 18px', textAlign: 'center' }}>
                <div style={{ color: '#fff', fontWeight: 900, fontSize: 21, lineHeight: 1.35 }}>AIオペレーター<br />「佐藤結衣」</div>
                <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15, marginTop: 4 }}>24時間・365日、あなたのお困りごとに寄り添います</div>
              </div>
            </div>
            <button onClick={() => window.dispatchEvent(new CustomEvent('openEstimate', {}))} className="yui-call-btn yui-call-btn-lg">
              <MessageCircle size={22} color="#fff" strokeWidth={2.2} style={{ flexShrink: 0 }} />
              <div className="yui-call-text">
                <div className="yui-call-main">佐藤結衣に相談する</div>
                <div className="yui-call-sub"><span className="yui-live-dot" /> 無料・即時応答</div>
              </div>
            </button>
            <p style={{ fontSize: 10, color: '#9ca3af', textAlign: 'center', lineHeight: 1.6, margin: '2px 0 0' }}>
              🔒 音声はGoogle Gemini AIで処理されます。<a href="/privacy" style={{ color: '#9ca3af', textDecoration: 'underline' }}>プライバシーポリシー</a>
            </p>
          </div>
        </div>
      </div>

      {/* お客様の声 */}
      <div className="reviews-section" id="reviews">
        <div className="reviews-inner">
          <div className="section-title">
            <span className="en">Customer Reviews</span>
            <h2>お客様のリアルな声</h2>
            <p>Googleマップ・生活110番に寄せられた実際のレビューをご紹介します</p>
          </div>

          {/* プラットフォーム評価バッジ */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1.5px solid #e8eaf0', borderRadius: 12, padding: '10px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1a3a6e' }}>📍 Googleマップ</span>
              <span style={{ color: '#fbbf24', fontSize: 16, letterSpacing: 1 }}>★★★★★</span>
              <span style={{ fontWeight: 900, fontSize: 18, color: '#1a1a2e' }}>5.0</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1.5px solid #e8eaf0', borderRadius: 12, padding: '10px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1a3a6e' }}>📋 暮らし110番</span>
              <span style={{ color: '#fbbf24', fontSize: 16, letterSpacing: 1 }}>★★★★</span>
              <span style={{ fontWeight: 900, fontSize: 18, color: '#1a1a2e' }}>4.1</span>
            </div>
          </div>

          <div className="reviews-grid">
            {[
              {
                src: '📍 Googleマップ', stars: '★★★★★',
                text: '最初にコウモリ駆除で他業者に頼んだら来るだけ来て2万円…。気持ちが悪いので地元の三友薬品さんに頼んだところ、課長さんがとても親身になって対応してくださいました。コウモリにしてもシロアリにしても本当に良い業者さんです。またお願いします。',
                name: 'Qoo O 様'
              },
              {
                src: '📍 Googleマップ', stars: '★★★★★',
                text: '地元で長年営業しており、信頼できる会社です。',
                name: '千葉祐二 様'
              },
              {
                src: '📋 暮らし110番', stars: '★★★★★',
                text: '夜中に天井裏からバタバタと足音や鳴き声がして非常に不快でした。丁寧な現地調査と見積もりの後、作業をお任せ。ハクビシンが住み着いていたと聞いて驚きましたが、作業後はあの長年悩まされた足音が完全に消えました。ゆっくり眠れます。',
                name: '匿名 様'
              },
              {
                src: '📋 暮らし110番', stars: '★★★★',
                text: '屋根裏にアライグマの親と子供が！見積もりは事前に明確に出してもらえ、アライグマを全て捕獲し、屋根まで綺麗にしてもらいました。明朗会計で安心してお任せできました。',
                name: '匿名 様'
              },
              {
                src: '📋 暮らし110番', stars: '★★★★',
                text: '用意するものや作業時間、料金、近所への影響など、たくさんの質問にすべてわかりやすく答えてもらえました。説明が丁寧で、安心してお願いすることができました。',
                name: '匿名 様'
              },
              {
                src: '📋 暮らし110番', stars: '★★★★',
                text: '実績も沢山あると聞いて依頼しました。スタッフの方はとても慣れていらしたようで、あっという間に捕獲に成功。自分ではどうにもできなかったのでお願いして良かったです。',
                name: '匿名 様'
              },
            ].map((r, i) => (
              <div key={i} className="review-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div className="review-source">{r.src}</div>
                  <div className="stars" style={{ fontSize: 14 }}>{r.stars}</div>
                </div>
                <p className="review-text">{r.text}</p>
                <div className="reviewer">{r.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 実績数値バナー */}
      <div className="trust-section">
        <div className="trust-inner">
          {[
            { val: '40', unit: '年', lbl: '大崎市での\n創業年数' },
            { val: '5,000', unit: '件+', lbl: '累計\n施工実績' },
            { val: '4.7', unit: '★', lbl: '口コミサイト\n平均評価' },
            { val: '24', unit: 'H', lbl: '365日\n受付対応' },
          ].map(n => (
            <div key={n.lbl} className="trust-num">
              <span className="val">{n.val}<span>{n.unit}</span></span>
              <div className="lbl" style={{ whiteSpace: 'pre-line' }}>{n.lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* サービス一覧 */}
      <div id="services" style={{ scrollMarginTop: 130 }}>
        <div className="section">
          <div className="section-title">
            <span className="en">Services</span>
            <h2>お困りごとから<br />お選びください</h2>
            <p>地域に密着した専門スタッフが迅速に対応いたします</p>
          </div>
          <div className="services-grid">
            {[
              { icon: '🦝', title: 'ハクビシン駆除', desc: '天井裏の足音・糞尿被害・悪臭。宮城県内で急増中のハクビシン被害に、専門チームが迅速対応。', price: '現地調査・お見積り無料', urgent: true, slug: 'hakubishin' },
              { icon: '🐀', title: 'ネズミ駆除', desc: '鳴き声・フン・食害・かじり傷。完全駆除から侵入防止工事まで一括対応。', price: '現地調査・お見積り無料', slug: 'nezumi' },
              { icon: '🐝', title: 'ハチ駆除', desc: 'スズメバチ・アシナガバチの巣の除去。安全装備で即日対応可能。', price: '現地調査・お見積り無料', slug: 'hachi' },
              { icon: '🪲', title: 'シロアリ防除', desc: '床下の湿気・木材の食害。定期点検から防除処理まで、建物を守ります。', price: '床下無料点検実施中', slug: 'shiroari' },
              { icon: '🦟', title: '害虫駆除全般', desc: 'ゴキブリ・ダニ・ノミ・トコジラミなど。飲食店・医療施設にも対応。', price: '現地調査・お見積り無料', slug: 'konchu' },
              { icon: '🐦', title: '鳥獣対策', desc: 'コウモリ・鳩・カラスなど。侵入防止ネット施工から忌避剤処理まで対応。', price: '現地調査・お見積り無料', slug: 'choryu' },
            ].map(s => (
              <a key={s.title} href={`/services/${s.slug}`} className={`service-card${s.urgent ? ' urgent' : ''}`} style={{ textDecoration: 'none', display: 'block', cursor: 'pointer' }}>
                <div className="service-icon">{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
                <div className="service-price">{s.price}</div>
                <div style={{ marginTop: 12, fontSize: 13, color: 'var(--orange)', fontWeight: 700 }}>詳しく見る →</div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ご依頼の流れ */}
      <div className="process-section" id="process">
        <div className="process-inner">
          <div className="section-title">
            <span className="en">Flow</span>
            <h2>ご依頼から完了までの流れ</h2>
            <p>お電話・チャットどちらからでもスムーズにご依頼いただけます</p>
          </div>
          <div className="process-steps">
            {[
              { icon: '🤖', num: 'STEP 01', title: 'AI受付・簡易見積', desc: '人間と変わらないAIが24時間受付しています。お気軽にご連絡ください。' },
              { icon: '🔍', num: 'STEP 02', title: '無料現地調査', desc: '専門スタッフが現地に伺い、被害状況・原因・範囲を詳しく調査します。' },
              { icon: '📋', num: 'STEP 03', title: '正式お見積り・説明', desc: '調査結果をわかりやすくご説明。明確な費用をご提示します。ご納得の上で施工。' },
              { icon: '✅', num: 'STEP 04', title: '施工・アフターフォロー', desc: '迅速・丁寧に施工。再発防止対策と定期フォローで長期安心をお届けします。' },
            ].map(s => (
              <div key={s.num} className="process-step">
                <div className="step-circle">{s.icon}</div>
                <div className="step-num">{s.num}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 被害アピールセクション */}
      <div style={{ background: '#fff', padding: '40px 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ display: 'inline-block', background: 'rgba(220,38,38,0.08)', border: '1.5px solid #dc2626', color: '#dc2626', fontSize: 12, fontWeight: 700, padding: '5px 18px', borderRadius: 20, letterSpacing: '0.1em', marginBottom: 14 }}>⚠️ こんなお悩み、ありませんか？</div>
            <h2 style={{ fontSize: 30, fontWeight: 900, color: '#1a3a6e', lineHeight: 1.4 }}>放っておくと、もっと大変なことになります</h2>
            <p style={{ color: '#6b7280', fontSize: 15, marginTop: 10 }}>害獣・シロアリは発見した時には、すでに深刻な被害が広がっています</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* ハクビシンカード */}
            <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '2px solid #f5821f', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 14, left: 14, background: '#f5821f', color: '#fff', fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 20, zIndex: 10, letterSpacing: '0.05em' }}>🦝 ハクビシン被害</div>
              <div style={{ width: '100%', height: 240, background: 'linear-gradient(135deg,#7c3a10,#4a1a00)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <div style={{ fontSize: 72, lineHeight: 1 }}>🦝</div>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 600, letterSpacing: '0.05em' }}>天井裏に潜む見えない脅威</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', padding: '0 16px' }}>
                  {['天井崩落リスク', '感染症リスク', '悪臭・資産価値低下'].map(t => (
                    <div key={t} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: 11, padding: '4px 12px', borderRadius: 20 }}>{t}</div>
                  ))}
                </div>
              </div>
              <div style={{ padding: '18px 20px 20px' }}>
                <h3 style={{ fontSize: 19, fontWeight: 900, color: '#1a3a6e', marginBottom: 10, lineHeight: 1.5 }}>天井裏の足音・悪臭・染み…<br />それ、ハクビシンかもしれません</h3>
                <p style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.85, marginBottom: 12 }}>放置すると天井が崩落・感染症リスクまで。早期発見が被害を最小限に抑えます。</p>
                <div style={{ background: '#fef9f5', borderRadius: 10, padding: '12px 16px', marginBottom: 14, borderLeft: '4px solid #f5821f' }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: '#f5821f', marginBottom: 8 }}>サンユー・ネクストの解決策</div>
                  {['侵入経路の完全封鎖', '糞尿除去・消毒・消臭処理', '再発防止の忌避施工'].map(item => (
                    <div key={item} style={{ fontSize: 13, color: '#374151', display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}><span style={{ color: '#f5821f', fontWeight: 700, flexShrink: 0 }}>✓</span>{item}</div>
                  ))}
                </div>
                <div style={{ background: 'linear-gradient(135deg,#1a3a6e,#2a5cbf)', color: '#fff', borderRadius: 10, padding: '14px 18px', textAlign: 'center', fontSize: 15, fontWeight: 900, lineHeight: 1.6 }}>半永久的に戻らないように<br />施工いたします！</div>
              </div>
            </div>

            {/* シロアリカード */}
            <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '2px solid #1a3a6e', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 14, left: 14, background: '#1a3a6e', color: '#fff', fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 20, zIndex: 2, letterSpacing: '0.05em' }}>🪲 シロアリ被害</div>
              <div style={{ width: '100%', height: 240, background: 'linear-gradient(135deg,#1a3a6e,#0d2240)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <div style={{ fontSize: 72, lineHeight: 1 }}>🏚️</div>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 600, letterSpacing: '0.05em' }}>床下・柱・土台を静かに蝕む</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['家屋強度低下', '倒壊リスク', '資産価値の減少'].map(t => (
                    <div key={t} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', fontSize: 11, padding: '4px 12px', borderRadius: 20 }}>{t}</div>
                  ))}
                </div>
              </div>
              <div style={{ padding: '18px 20px 20px' }}>
                <h3 style={{ fontSize: 19, fontWeight: 900, color: '#1a3a6e', marginBottom: 10, lineHeight: 1.5 }}>気づいた時には手遅れ…<br />シロアリは「見えない場所」を食べ続ける</h3>
                <p style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.85, marginBottom: 12 }}>築5年以降の住宅はシロアリリスクが急増。床下無料点検で早期発見が可能です。</p>
                <div style={{ background: '#f0f4ff', borderRadius: 10, padding: '12px 16px', marginBottom: 14, borderLeft: '4px solid #1a3a6e' }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: '#1a3a6e', marginBottom: 8 }}>サンユー・ネクストの解決策</div>
                  {['床下無料点検（要予約）', '薬剤処理による完全防除', '5年保証付き定期フォロー'].map(item => (
                    <div key={item} style={{ fontSize: 13, color: '#374151', display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}><span style={{ color: '#1a3a6e', fontWeight: 700, flexShrink: 0 }}>✓</span>{item}</div>
                  ))}
                </div>
                <div style={{ background: 'linear-gradient(135deg,#1a3a6e,#2a5cbf)', color: '#fff', borderRadius: 10, padding: '14px 18px', textAlign: 'center', fontSize: 15, fontWeight: 900, lineHeight: 1.6 }}>半永久的に戻らないように<br />施工いたします！</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* フッター */}
      <footer className="site-footer" id="contact">
        <div className="footer-inner">
          <div className="footer-brand" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <img src="/uploads/logo-main.png" alt="SunYou Next" style={{ height: 72, background: '#fff', borderRadius: 12, padding: '6px 16px', boxShadow: '0 2px 12px rgba(0,0,0,0.25)', display: 'block', margin: '0 auto' }} />
            <p>大崎市に根ざして40年。三友薬品消毒は、害虫・害獣駆除のプロフェッショナルとして、サンユー・ネクストとともに、新しい時代の技術で地域の皆様の安全・安心を守り続けます。</p>
          </div>
          <div onClick={() => { const el = document.getElementById('ai'); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 130, behavior: 'smooth' }) }} style={{ flexShrink: 0, width: 300, display: 'flex', alignItems: 'stretch', background: 'linear-gradient(135deg,#102650,#1a3a6e)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 20px rgba(16,38,80,0.5)', cursor: 'pointer', border: '2px solid rgba(255,255,255,0.25)' }}>
            <div style={{ width: 90, flexShrink: 0, overflow: 'hidden' }}>
              <img src="/uploads/ai-operator.png" alt="佐藤結衣" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', display: 'block' }} />
            </div>
            <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 6, textAlign: 'center' }}>
              <div style={{ background: 'rgba(255,255,255,0.25)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, letterSpacing: '0.05em' }}>🕐 24時間365日受付</div>
              <div style={{ color: '#fff', fontWeight: 900, fontSize: 17, lineHeight: 1.35 }}>AIオペレーター<br />佐藤結衣</div>
              <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, lineHeight: 1.55 }}>お問い合わせも私が伺います。<br />お気軽にお声がけください</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 52, alignItems: 'flex-start', flexShrink: 0 }}>
            <nav className="footer-nav">
              <h4>サービス</h4>
              <ul>
                {[
                  { label: 'ハクビシン駆除', slug: 'hakubishin' },
                  { label: 'ネズミ駆除',     slug: 'nezumi' },
                  { label: 'ハチ駆除',       slug: 'hachi' },
                  { label: 'シロアリ防除',   slug: 'shiroari' },
                  { label: '害虫駆除全般',   slug: 'konchu' },
                  { label: '鳥獣対策',       slug: 'choryu' },
                ].map(s => <li key={s.slug}><a href={`/services/${s.slug}`}>{s.label}</a></li>)}
              </ul>
            </nav>
            <nav className="footer-nav">
              <h4>会社情報</h4>
              <ul>
                <li><a href="/company">会社概要</a></li>
                <li><a href="#">施工実績</a></li>
                <li><a href="/privacy">プライバシーポリシー</a></li>
                <li><a href="/faq">よくある質問</a></li>
                <li><a href="#ai">お問い合わせ</a></li>
              </ul>
            </nav>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 SunYou Next LLC（サンユー・ネクスト合同会社）業務提携：三友薬品消毒 ｜ 宮城県大崎市</p>
        </div>
      </footer>

      {/* AI見積りモーダル */}
      <EstimateChatModal />

      {/* FABボタン（右下固定） */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9980, fontFamily: "'Noto Sans JP', sans-serif" }}>
        <button
          onClick={() => { const el = document.getElementById('ai'); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 130, behavior: 'smooth' }) }}
          style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #1a3a6e, #2a5cbf)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(26,58,110,0.5)', position: 'relative', overflow: 'hidden', padding: 0, transition: 'transform 0.2s' }}
        >
          <img src="/uploads/ai-operator.png" alt="AI" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
          <span style={{ position: 'absolute', top: -36, right: 0, background: '#1a3a6e', color: '#fff', fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 10, whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', pointerEvents: 'none' }}>AIで無料相談</span>
        </button>
      </div>
    </>
  )
}
