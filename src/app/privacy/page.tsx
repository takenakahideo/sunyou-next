'use client'

import Link from 'next/link'

const ARTICLES = [
  {
    title: '第1条（個人情報の定義）',
    body: '本プライバシーポリシーにおける「個人情報」とは、個人情報の保護に関する法律（個人情報保護法）第2条第1項に定める個人情報、すなわち生存する個人に関する情報であって、当該情報に含まれる氏名、住所、電話番号その他の記述等により特定の個人を識別できるものをいいます。',
  },
  {
    title: '第2条（個人情報の取得と利用目的）',
    body: '当社は、以下の目的のために個人情報を取得・利用します。\n\n① サービスのご提供・お問い合わせへの対応\nお名前・ご住所・お電話番号等のお客様情報は、現地調査・施工・アフターフォローなどのサービス提供およびご連絡のために使用します。\n\n② AIシステムによる受付業務\nAIオペレーター「佐藤結衣」（Google Gemini Live APIを利用）を通じてご提供いただいた音声・テキスト情報は、受付業務の処理および品質向上のために使用します。\n\n③ サービス改善・統計分析\n取得した情報を統計的に処理し、サービス品質の向上に役立てます。この場合、個人を特定できない形に加工した上で利用します。',
  },
  {
    title: '第3条（AIシステム（音声データ）の取り扱い）',
    body: '当社のウェブサイトでは、Google LLC が提供する「Gemini Live API」を使用したAI音声受付サービスを提供しています。本サービスをご利用いただく際には、以下の事項をご確認ください。\n\n① 音声データの送信\nお客様がマイクを通じてお話しいただいた音声は、リアルタイムでGoogle LLCのサーバーに送信され、AIによる音声認識・応答生成に使用されます。\n\n② データの保持\n音声データおよびそこから生成されたテキストデータは、当社のシステム内で受付情報として記録されます。Google LLCにおけるデータの取り扱いについては、Google社のプライバシーポリシー（https://policies.google.com/privacy）をご参照ください。\n\n③ 任意性\nAI音声受付のご利用は任意です。音声によるご相談が難しい場合は、お電話またはお問い合わせフォームをご利用ください。',
  },
  {
    title: '第4条（第三者への個人情報の提供）',
    body: '当社は、以下の場合を除き、お客様の個人情報を第三者に提供することはありません。\n\n① お客様の同意がある場合\n② 法令に基づく開示要請がある場合\n③ 人の生命・身体・財産の保護のために必要がある場合\n④ 業務委託先（施工会社・三友薬品消毒等）への必要最小限の情報提供。この場合、委託先に対して適切な監督を行います。',
  },
  {
    title: '第5条（クッキー・アクセス解析）',
    body: '当社ウェブサイトでは、利便性向上のためにクッキー（Cookie）を使用する場合があります。クッキーはブラウザの設定により無効にすることが可能ですが、一部機能がご利用いただけなくなる場合があります。また、アクセス状況の把握のためにアクセス解析ツールを利用する場合があります。',
  },
  {
    title: '第6条（個人情報の安全管理）',
    body: '当社は、お客様の個人情報を正確かつ最新の状態に保ち、個人情報への不正アクセス・紛失・破損・改ざん・漏洩などを防止するため、適切なセキュリティ対策を実施します。',
  },
  {
    title: '第7条（個人情報の開示・訂正・削除）',
    body: 'お客様は、当社が保有するご自身の個人情報について、開示・訂正・利用停止・削除を請求する権利を有します。ご請求の際は、下記お問い合わせ窓口までご連絡ください。本人確認の上、合理的な期間内に対応いたします。',
  },
  {
    title: '第8条（プライバシーポリシーの変更）',
    body: '当社は、法令の変更やサービス内容の変更に伴い、本ポリシーを改定することがあります。重要な変更がある場合は、ウェブサイト上でお知らせします。改定後のポリシーは、掲載した時点から効力を生じるものとします。',
  },
  {
    title: '第9条（お問い合わせ窓口）',
    body: '個人情報の取り扱いに関するお問い合わせは、下記までご連絡ください。\n\n社名：SunYou Next LLC（サンユー・ネクスト合同会社）\n代表者：竹中 栄雄\n所在地：〒989-6242 宮城県大崎市古川北宮沢字下前田57－1\n電話：090-8897-7972\nお問い合わせ：当サイトのAI受付よりご連絡ください',
  },
]

export default function PrivacyPage() {
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
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.15em', fontWeight: 700, marginBottom: 10 }}>PRIVACY POLICY</div>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: '#fff', lineHeight: 1.4, fontFamily: "'Noto Sans JP', sans-serif", margin: 0 }}>プライバシーポリシー</h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15, marginTop: 12, fontFamily: "'Noto Sans JP', sans-serif" }}>個人情報の取り扱いについて</p>
      </div>

      <main style={{ fontFamily: "'Noto Sans JP', sans-serif", background: '#f8f9fc', padding: '48px 24px 80px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>

          {/* 前文 */}
          <div style={{ background: '#fff', borderRadius: 12, padding: '28px 32px', marginBottom: 32, border: '1px solid #e8eaf0', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 2, margin: 0 }}>
              SunYou Next LLC（サンユー・ネクスト合同会社、以下「当社」）は、お客様の個人情報の保護を重要な責務と考え、個人情報の保護に関する法律（個人情報保護法）およびその他関連法令を遵守し、以下のとおりプライバシーポリシーを定めます。
            </p>
          </div>

          {/* AI利用注意書き */}
          <div style={{ background: '#fff8f0', border: '2px solid #f5821f', borderRadius: 12, padding: '20px 28px', marginBottom: 32, display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 24, flexShrink: 0 }}>🤖</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#f5821f', marginBottom: 6 }}>AI音声サービス（Gemini Live）をご利用の方へ</div>
              <p style={{ fontSize: 13, color: '#6b4c00', lineHeight: 1.85, margin: 0 }}>
                当サイトのAI受付「佐藤結衣」はGoogle Gemini Live APIを使用しています。音声通話中の音声データはGoogleのサーバーにリアルタイム送信されます。詳細は第3条をご確認ください。
              </p>
            </div>
          </div>

          {/* 条文 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {ARTICLES.map((art, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid #e8eaf0', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                <div style={{ background: 'linear-gradient(135deg, #1a3a6e, #2a4f8f)', padding: '14px 24px' }}>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>{art.title}</h2>
                </div>
                <div style={{ padding: '20px 24px' }}>
                  <p style={{ fontSize: 14, color: '#374151', lineHeight: 2, margin: 0, whiteSpace: 'pre-line' }}>{art.body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 制定日 */}
          <div style={{ textAlign: 'right', marginTop: 32, fontSize: 13, color: '#9ca3af' }}>
            <p>制定日：2026年7月3日</p>
            <p>SunYou Next LLC（サンユー・ネクスト合同会社）</p>
          </div>
        </div>
      </main>

      {/* フッター */}
      <footer style={{ background: '#0d2240', color: 'rgba(255,255,255,0.6)', textAlign: 'center', padding: '24px', fontSize: 13, fontFamily: "'Noto Sans JP', sans-serif" }}>
        <p>© 2026 SunYou Next LLC（サンユー・ネクスト合同会社）業務提携：三友薬品消毒 ｜ 宮城県大崎市</p>
      </footer>
    </>
  )
}
