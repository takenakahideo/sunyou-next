'use client'

import { useState } from 'react'
import Link from 'next/link'

const CATEGORIES = [
  {
    id: 'price',
    icon: '💴',
    label: '料金・お支払い',
    items: [
      {
        q: '現地調査・お見積りは本当に無料ですか？',
        a: 'はい、完全無料です。調査費用・出張費用は一切いただきません。見積もりをご覧になった後にお断りいただいても、キャンセル料等は発生しませんのでご安心ください。',
      },
      {
        q: 'クレジットカードや電子マネーでの支払いはできますか？',
        a: '申し訳ございません。クレジットカード・電子マネーでの支払いは施工会社との調整中です。現在は施工の際の現金で承っております。お振込みの際は、お気軽にご相談ください。',
      },
      {
        q: '他社より高い場合は交渉できますか？',
        a: '他社のお見積りをお持ちいただいた場合、内容をご確認した上で誠実にご対応いたします。高額になりがちな全国チェーン業者とは異なり、地元密着の適正価格を常に心がけております。',
      },
      {
        q: '分割払いや後払いはできますか？',
        a: '施工規模によってはご相談に応じる場合がございます。お気軽にご相談ください。',
      },
    ],
  },
  {
    id: 'survey',
    icon: '🔍',
    label: '現地調査・見積もり',
    items: [
      {
        q: '害獣・害虫を実際に目視していなくても調査してもらえますか？',
        a: 'もちろんです。足音・フン・悪臭・かじり跡など、間接的な痕跡だけでも調査は可能です。専門スタッフが屋根裏・床下など目視しにくい場所も含め、丁寧に確認いたします。',
      },
      {
        q: '調査の際、部屋の中に入ることはありますか？',
        a: '侵入経路の特定や被害状況の確認のため、室内・屋根裏・床下に立ち入る場合がございます。事前にご説明の上、お客様の許可を得てから作業いたしますのでご安心ください。',
      },
      {
        q: '調査前に部屋を片付ける必要はありますか？',
        a: '基本的に不要です。ただし、床下や屋根裏への入り口付近のスペースだけご確保いただけると助かります。事前にご案内いたします。',
      },
      {
        q: '調査はどのくらいの時間がかかりますか？',
        a: '一般的な一戸建て住宅で2〜3時間程度が目安です。被害範囲が広い場合や複数箇所を調査する場合はもう少しかかることがあります。',
      },
      {
        q: '見積もり後、すぐに施工しなければなりませんか？',
        a: 'いいえ、その場での契約は一切不要です。お見積り内容をご家族でご相談いただいた後、ご連絡いただければ結構です。',
      },
    ],
  },
  {
    id: 'work',
    icon: '🛠️',
    label: '作業内容',
    items: [
      {
        q: '駆除だけでなく、消毒・消臭もやってもらえますか？',
        a: 'はい、対応しております。害獣の糞尿除去・消毒・消臭処理まで一括してお任せいただけます。駆除後の衛生管理まで含めてご提案いたします。',
      },
      {
        q: '侵入口の封鎖工事もお願いできますか？',
        a: 'はい、侵入経路の完全封鎖工事も対応しております。再発を防ぐために、駆除と封鎖工事はセットでのご依頼をおすすめしています。',
      },
      {
        q: '作業中の騒音や臭いはありますか？近所への影響が心配です。',
        a: '薬剤使用時に一時的な臭いが生じる場合がございますが、安全な薬剤を使用しており、近隣への影響は最小限です。気になる場合は事前にご相談ください。',
      },
      {
        q: '作業中は家にいる必要がありますか？',
        a: '原則として、作業中は立ち会いをお願いしております。ご都合によってはご相談ください。',
      },
      {
        q: '対応できる害虫・害獣の種類を教えてください。',
        a: 'ハクビシン・タヌキ・アライグマ・コウモリ・鳩・カラスなどの害獣、スズメバチ・アシナガバチ・ネズミ・シロアリ・ゴキブリ・ダニ・ノミ・トコジラミなど、幅広く対応しております。',
      },
    ],
  },
  {
    id: 'after',
    icon: '🛡️',
    label: 'アフターサービス',
    items: [
      {
        q: '施工後に再発した場合はどうなりますか？',
        a: '保証期間内の再発は、原則として無料で再施工いたします。保証内容・期間は施工内容によって異なりますので、見積もり時に詳しくご説明いたします。',
      },
      {
        q: '保証期間はどのくらいですか？',
        a: '施工内容によって異なりますが、シロアリ防除は最長5年保証（定期点検付き）、その他の駆除工事は1〜3年保証が目安です。詳細は担当スタッフへご確認ください。',
      },
      {
        q: '施工後の定期点検はありますか？',
        a: 'はい、ご希望のお客様には定期フォロー点検をご提供しております。特にシロアリ防除・ハクビシン対策は年1回の定期点検をおすすめしています。',
      },
      {
        q: '施工後に気になることがあったらすぐ連絡できますか？',
        a: 'もちろんです。施工後のご不明点・ご不安はお気軽にご連絡ください。担当スタッフが迅速に対応いたします。',
      },
    ],
  },
  {
    id: 'schedule',
    icon: '📅',
    label: 'スケジュール',
    items: [
      {
        q: '急いでいるのですが、当日対応は可能ですか？',
        a: '状況によっては当日対応も可能です。まずはAI相談にてご連絡ください。スタッフの空き状況を確認の上、できる限り早急に対応いたします。',
      },
      {
        q: '土日・祝日でも対応してもらえますか？',
        a: 'はい、土日・祝日も対応しております。AI相談は24時間365日受付しております。現地調査は平日9〜17時が基本ですが、ご事情がある場合はご相談ください。',
      },
      {
        q: '作業はどのくらいの日数がかかりますか？',
        a: '通常、小規模な駆除作業は1日、封鎖工事や消毒・消臭を含む場合は2〜3日が目安です。被害の範囲や作業内容によって変わりますので、見積もり時にご説明いたします。',
      },
      {
        q: '仕事があって平日は難しいのですが…',
        a: '早朝・夜間対応については個別にご相談ください。できる限りお客様のご都合に合わせるよう努めます。',
      },
    ],
  },
  {
    id: 'area',
    icon: '📍',
    label: '対応エリア・会社情報',
    items: [
      {
        q: '対応エリアはどこですか？',
        a: '宮城県全域に対応しております。大崎市を中心に、仙台市・石巻市・登米市・栗原市など県内全域へ出張いたします。県外についてはご相談ください。',
      },
      {
        q: '三友薬品消毒とサンユー・ネクストはどういう関係ですか？',
        a: '三友薬品消毒は大崎市で創業40年の地元密着の害虫・害獣駆除会社です。サンユー・ネクストは三友薬品消毒と業務提携し、AIを活用した24時間受付・見積もりサービスをご提供する窓口です。施工は三友薬品消毒のスタッフが担当いたします。',
      },
      {
        q: '営業時間を教えてください。',
        a: 'AI相談は24時間365日受付しております。現地調査・施工は平日9〜17時が基本です。緊急の場合はAI相談からご連絡ください。',
      },
      {
        q: '農場・店舗・飲食店にも対応していますか？',
        a: 'はい、対応しております。一般住宅だけでなく、農場・倉庫・飲食店・医療施設など業種を問わず対応しております。',
      },
    ],
  },
]

function AccordionItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      style={{
        borderBottom: '1px solid #e8eaf0',
        overflow: 'hidden',
      }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          textAlign: 'left',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '18px 20px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 14,
          fontFamily: "'Noto Sans JP', sans-serif",
        }}
      >
        <span style={{
          flexShrink: 0,
          width: 26,
          height: 26,
          borderRadius: '50%',
          background: '#f5821f',
          color: '#fff',
          fontWeight: 900,
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 1,
        }}>Q</span>
        <span style={{ flex: 1, fontSize: 15, fontWeight: 700, color: '#1a1a2e', lineHeight: 1.6 }}>{q}</span>
        <span style={{
          flexShrink: 0,
          width: 24,
          height: 24,
          borderRadius: '50%',
          border: '2px solid #d1d5db',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          color: '#6b7280',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.25s',
          marginTop: 2,
        }}>▼</span>
      </button>
      {open && (
        <div style={{
          display: 'flex',
          gap: 14,
          padding: '0 20px 18px',
        }}>
          <span style={{
            flexShrink: 0,
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: '#1a3a6e',
            color: '#fff',
            fontWeight: 900,
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 1,
          }}>A</span>
          <p style={{
            flex: 1,
            fontSize: 14,
            color: '#374151',
            lineHeight: 1.85,
            margin: 0,
          }}>{a}</p>
        </div>
      )}
    </div>
  )
}

export default function FaqPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Noto Sans JP', sans-serif; color: #1a1a2e; background: #f8f9fc; }
        a { text-decoration: none; color: inherit; }
      `}</style>

      {/* ヘッダー */}
      <header style={{
        background: '#1a3a6e',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 12px rgba(26,58,110,0.3)',
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '14px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <img src="/uploads/logo-main.png" alt="SunYou Next" style={{ height: 52, borderRadius: 8, padding: '4px 10px', background: '#fff' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>大崎市で創業40年。信頼と実績。</span>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>「三友薬品消毒」が「サンユー・ネクスト」</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>と業務提携いたしました！</span>
            </div>
          </Link>
          <Link href="/" style={{
            background: 'rgba(255,255,255,0.15)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: 8,
            padding: '8px 18px',
            fontSize: 13,
            fontWeight: 700,
          }}>← トップページへ</Link>
        </div>
      </header>

      {/* ページタイトル */}
      <div style={{
        background: 'linear-gradient(135deg, #1a3a6e 0%, #2a5cbf 100%)',
        padding: '48px 32px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.15em', fontWeight: 700, marginBottom: 10 }}>FAQ</div>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: '#fff', lineHeight: 1.4 }}>よくある質問</h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15, marginTop: 12 }}>お客様からよくいただくご質問をまとめました</p>
      </div>

      {/* カテゴリーナビ */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e8eaf0', position: 'sticky', top: 64, zIndex: 50 }}>
        <div style={{
          maxWidth: 1000,
          margin: '0 auto',
          padding: '0 20px',
          display: 'flex',
          gap: 4,
          overflowX: 'auto',
        }}>
          {CATEGORIES.map(cat => (
            <a
              key={cat.id}
              href={`#${cat.id}`}
              style={{
                flexShrink: 0,
                padding: '14px 16px',
                fontSize: 13,
                fontWeight: 700,
                color: '#1a3a6e',
                borderBottom: '3px solid transparent',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >{cat.icon} {cat.label}</a>
          ))}
        </div>
      </div>

      {/* FAQ本体 */}
      <main style={{ maxWidth: 860, margin: '0 auto', padding: '48px 24px 80px' }}>
        {CATEGORIES.map(cat => (
          <section key={cat.id} id={cat.id} style={{ marginBottom: 48, scrollMarginTop: 120 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 20,
              paddingBottom: 14,
              borderBottom: '2px solid #1a3a6e',
            }}>
              <span style={{ fontSize: 24 }}>{cat.icon}</span>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: '#1a3a6e' }}>{cat.label}</h2>
            </div>
            <div style={{
              background: '#fff',
              borderRadius: 12,
              overflow: 'hidden',
              border: '1px solid #e8eaf0',
              boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
            }}>
              {cat.items.map((item, i) => (
                <AccordionItem key={i} q={item.q} a={item.a} />
              ))}
            </div>
          </section>
        ))}

        {/* 解決しない場合のCTA */}
        <div style={{
          background: 'linear-gradient(135deg, #1a3a6e, #2a5cbf)',
          borderRadius: 16,
          padding: '36px 32px',
          textAlign: 'center',
          color: '#fff',
        }}>
          <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 10 }}>疑問が解決しませんでしたか？</div>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, lineHeight: 1.8, marginBottom: 24 }}>
            AIオペレーター「佐藤結衣」が24時間いつでもお答えします。<br />
            お気軽にご相談ください。
          </p>
          <Link href="/#ai" style={{
            display: 'inline-block',
            background: '#f5821f',
            color: '#fff',
            fontWeight: 900,
            fontSize: 15,
            padding: '14px 36px',
            borderRadius: 50,
            boxShadow: '0 4px 16px rgba(245,130,31,0.5)',
          }}>
            🤖 AIに無料相談する
          </Link>
        </div>
      </main>

      {/* フッター */}
      <footer style={{
        background: '#0d2240',
        color: 'rgba(255,255,255,0.6)',
        textAlign: 'center',
        padding: '24px',
        fontSize: 13,
      }}>
        <p>© 2025 SunYou Next LLC（サンユー・ネクスト LLC）業務提携：三友薬品消毒 ｜ 宮城県大崎市</p>
      </footer>
    </>
  )
}
