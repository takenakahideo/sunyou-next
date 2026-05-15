'use client'

import Link from 'next/link'

const PROFILE = [
  { label: '社名',       value: 'SunYou Next LLC（サンユー・ネクスト合同会社）' },
  { label: '代表社員',   value: '竹中 栄雄' },
  { label: '設立',       value: '2026年7月3日' },
  { label: '所在地',     value: '〒989-6242 宮城県大崎市古川北宮沢字下前田57－1' },
  { label: '電話番号',   value: '090-8897-7972' },
  { label: '事業内容',   value: 'AIシステム開発・コンサルティング、事業承継支援、デジタルコンテンツ制作、版権管理、環境衛生事業、再生可能エネルギー運用 他' },
]

const BUSINESSES = [
  {
    num: '01',
    en: 'AI & Digital Transformation',
    title: 'AI・DXソリューション事業',
    icon: '🤖',
    lead: '地方の中小企業や公的セクターが抱える「属人化」や「人材不足」の課題を、最先端のAI技術で解決します。現場の負担を極限まで減らす「ゼロ・タップ」の思想に基づいたシステムを企画・開発・提供し、小規模事業者の事業承継をお手伝いしています。',
    items: [
      { title: 'AIバックオフィス構築', desc: '音声AI受付、画像認識による自動経理、GPS連携日報など、地方企業向けの業務完全自動化システムの開発・導入支援。' },
      { title: 'パブリック・セクター向けDX', desc: '個人業務の効率化を支援する「AI秘書」ツールの企画・開発。' },
      { title: 'コミュニティ・プラットフォーム', desc: 'マンション管理組合の合意形成や情報共有をスマートにする専用ポータルの構築。' },
    ],
  },
  {
    num: '02',
    en: 'Creative & Intellectual Property',
    title: 'クリエイティブ・IP事業',
    icon: '🎨',
    lead: 'テクノロジーと芸術を融合させ、新たな文化的価値とエンターテインメントを創出・発信します。',
    items: [
      { title: 'コンテンツ制作', desc: '最新の生成AIを活用した小説、映像コンテンツ、デジタルアート等の企画・制作および世界観の構築。' },
      { title: 'イベント・マネジメント', desc: '音楽コンサートや各種興行の企画・運営、および付随するプロモーション活動。' },
      { title: '知的財産管理', desc: 'デジタルコンテンツやキャラクター等の版権（著作権）の管理および許諾業務。' },
    ],
  },
  {
    num: '03',
    en: 'Environment & Sustainability',
    title: '環境衛生・サステナビリティ事業',
    icon: '🌿',
    lead: '地域住民の安心で豊かな暮らしを守るための実務運営と、持続可能な地域社会に向けたアセット（資産）の運用を行います。',
    items: [
      { title: '環境衛生事業の運営・管理', desc: '大崎市で40余年の実績を持つ害虫・害獣駆除ブランド「三友薬品消毒」の事業統括。独自のAIシステムを現場実装し、迅速かつ誠実なサービスを提供。' },
      { title: '再生可能エネルギー・不動産管理', desc: '太陽光発電施設などのサステナブルなインフラ管理、および自社不動産の運用。' },
    ],
  },
]

export default function CompanyPage() {
  return (
    <>
      {/* ヘッダー */}
      <header style={{ background: '#1a3a6e', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(26,58,110,0.3)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 16, textDecoration: 'none' }}>
            <img src="/uploads/logo-main.png" alt="SunYou Next" style={{ height: 52, borderRadius: 8, padding: '4px 10px', background: '#fff' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>大崎市で創業40年。信頼と実績。</span>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>「三友薬品消毒」が<span style={{ color: '#ffa04a' }}>「サンユー・ネクスト」</span></span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', textAlign: 'right' }}>と業務提携いたしました！</span>
            </div>
          </Link>
          <Link href="/" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>← トップページへ</Link>
        </div>
      </header>

      {/* ページタイトル */}
      <div style={{ background: 'linear-gradient(135deg, #1a3a6e 0%, #2a5cbf 100%)', padding: '48px 32px', textAlign: 'center' }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.15em', fontWeight: 700, marginBottom: 10 }}>COMPANY</div>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: '#fff', lineHeight: 1.4, fontFamily: "'Noto Sans JP', sans-serif", margin: 0 }}>会社概要</h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15, marginTop: 12, fontFamily: "'Noto Sans JP', sans-serif" }}>SunYou Next LLC — テクノロジーで地域の未来をひらく</p>
      </div>

      <main style={{ fontFamily: "'Noto Sans JP', sans-serif", background: '#f8f9fc' }}>

        {/* ビジョン */}
        <section style={{ background: '#fff', padding: '64px 32px' }}>
          <div style={{ maxWidth: 860, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <div style={{ fontSize: 12, color: '#f5821f', letterSpacing: '0.15em', fontWeight: 700, marginBottom: 10 }}>VISION</div>
              <h2 style={{ fontSize: 26, fontWeight: 900, color: '#1a3a6e', lineHeight: 1.5, margin: 0 }}>私たちのビジョン</h2>
            </div>
            <div style={{ background: 'linear-gradient(135deg, #1a3a6e, #2a5cbf)', borderRadius: 16, padding: '40px 48px', textAlign: 'center' }}>
              <p style={{ fontSize: 20, fontWeight: 900, color: '#ffa04a', lineHeight: 1.7, margin: '0 0 24px', letterSpacing: '0.02em' }}>
                「太陽のように地域を照らし、<br />テクノロジーで『あなた』に寄り添う。」
              </p>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.88)', lineHeight: 2, margin: 0 }}>
                SunYou Next LLCは、40年にわたり地域で培われてきた「誠実な信頼」を築いた三友薬品消毒を土台に生まれた、最先端のAI技術とクリエイティビティを掛け合わせ、次世代（Next）の社会課題を解決するテック＆クリエイティブカンパニーです。
              </p>
            </div>
          </div>
        </section>

        {/* 事業内容 */}
        <section style={{ padding: '64px 32px', background: '#f8f9fc' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div style={{ fontSize: 12, color: '#f5821f', letterSpacing: '0.15em', fontWeight: 700, marginBottom: 10 }}>BUSINESS AREAS</div>
              <h2 style={{ fontSize: 26, fontWeight: 900, color: '#1a3a6e', margin: 0 }}>事業内容</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              {BUSINESSES.map(biz => (
                <div key={biz.num} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: '1px solid #e8eaf0' }}>
                  <div style={{ background: 'linear-gradient(135deg, #1a3a6e, #2a4f8f)', padding: '24px 32px', display: 'flex', alignItems: 'center', gap: 20 }}>
                    <span style={{ fontSize: 36 }}>{biz.icon}</span>
                    <div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.12em', marginBottom: 4 }}>{biz.num} — {biz.en}</div>
                      <h3 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: 0 }}>{biz.title}</h3>
                    </div>
                  </div>
                  <div style={{ padding: '28px 32px' }}>
                    <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.9, marginBottom: 24 }}>{biz.lead}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {biz.items.map(item => (
                        <div key={item.title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                          <span style={{ flexShrink: 0, width: 6, height: 6, borderRadius: '50%', background: '#f5821f', marginTop: 8 }} />
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#1a3a6e', marginBottom: 4 }}>{item.title}</div>
                            <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.8 }}>{item.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 会社概要テーブル */}
        <section style={{ background: '#fff', padding: '64px 32px' }}>
          <div style={{ maxWidth: 860, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <div style={{ fontSize: 12, color: '#f5821f', letterSpacing: '0.15em', fontWeight: 700, marginBottom: 10 }}>COMPANY PROFILE</div>
              <h2 style={{ fontSize: 26, fontWeight: 900, color: '#1a3a6e', margin: 0 }}>会社概要</h2>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {PROFILE.map((row, i) => (
                  <tr key={row.label} style={{ borderBottom: '1px solid #e8eaf0', background: i % 2 === 0 ? '#f8f9fc' : '#fff' }}>
                    <th style={{ width: 140, padding: '18px 24px', textAlign: 'left', fontSize: 14, fontWeight: 700, color: '#1a3a6e', whiteSpace: 'nowrap', verticalAlign: 'top' }}>{row.label}</th>
                    <td style={{ padding: '18px 24px', fontSize: 14, color: '#374151', lineHeight: 1.8 }}>{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* CTA */}
        <section style={{ background: 'linear-gradient(135deg, #1a3a6e, #2a5cbf)', padding: '48px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', marginBottom: 10 }}>害虫・害獣でお困りの方へ</div>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 1.8, marginBottom: 24 }}>AIオペレーター「佐藤結衣」が24時間いつでもお答えします。</p>
          <Link href="/#ai" style={{ display: 'inline-block', background: '#f5821f', color: '#fff', fontWeight: 900, fontSize: 15, padding: '14px 36px', borderRadius: 50, boxShadow: '0 4px 16px rgba(245,130,31,0.5)', textDecoration: 'none' }}>
            🤖 AIに無料相談する
          </Link>
        </section>
      </main>

      {/* フッター */}
      <footer style={{ background: '#0d2240', color: 'rgba(255,255,255,0.6)', textAlign: 'center', padding: '24px', fontSize: 13, fontFamily: "'Noto Sans JP', sans-serif" }}>
        <p>© 2026 SunYou Next LLC（サンユー・ネクスト合同会社）業務提携：三友薬品消毒 ｜ 宮城県大崎市</p>
      </footer>
    </>
  )
}
