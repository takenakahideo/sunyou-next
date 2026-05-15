'use client'

import { use } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MessageCircle } from 'lucide-react'
import { EstimateChatModal } from '@/components/EstimateChatModal'

// ─── サービスデータ ────────────────────────────────────────
const SERVICES: Record<string, {
  icon: string
  title: string
  catch: string
  color: string
  symptoms: string[]
  risks: { icon: string; title: string; desc: string }[]
  works: { icon: string; title: string; desc: string }[]
  // 施工写真：/uploads/service-{slug}-1.png 等を配置するとここに表示されます
  photos: string[]
  faqs: { q: string; a: string }[]
  freeLabel: string
}> = {
  hakubishin: {
    icon: '🦝',
    title: 'ハクビシン駆除',
    catch: '天井からの足音・悪臭…放置すると天井が崩落することも',
    color: '#f5821f',
    symptoms: [
      '天井裏から足音・鳴き声がする',
      '天井にシミや黄ばみが広がっている',
      '屋根裏から強い悪臭がする',
      '外壁や屋根に侵入口らしき穴がある',
      '庭や畑の農作物が荒らされている',
      'フンや体毛の痕跡がある',
    ],
    risks: [
      { icon: '🏚️', title: '天井崩落リスク', desc: '糞尿が天井板に染み込み、腐食が進むと天井が崩れ落ちる危険があります。' },
      { icon: '🦠', title: '感染症リスク', desc: 'ハクビシンのフンにはさまざまな病原菌が含まれており、人への感染リスクがあります。' },
      { icon: '📉', title: '資産価値の低下', desc: '悪臭・汚染が広がると、建物の資産価値が大幅に下がる可能性があります。' },
    ],
    works: [
      { icon: '🔍', title: '現地調査・侵入経路の特定', desc: '屋根裏・床下・外壁を調査し、ハクビシンの侵入経路・糞尿の状況・被害範囲を確認します。' },
      { icon: '🚫', title: '侵入経路の完全封鎖', desc: '特定した侵入口を専用資材で塞ぎ、再侵入を防ぎます。' },
      { icon: '🧹', title: '糞尿の除去・消毒・消臭', desc: '蓄積した糞尿を丁寧に除去し、消毒・消臭処理を行います。' },
      { icon: '🛡️', title: '再発防止の忌避施工', desc: '忌避剤の設置など、再発防止対策を施します。施工後のアフターフォローも対応。' },
    ],
    photos: [
      '/uploads/service-hakubishin-1.png',
      '/uploads/service-hakubishin-2.png',
    ],
    faqs: [
      { q: 'ハクビシンは人を噛みますか？', a: '基本的に臆病な動物ですが、追い詰められると噛むことがあります。素手で触れることは危険ですので、発見されても近づかず、専門業者にご連絡ください。' },
      { q: '自分で追い出すことはできますか？', a: '市販の忌避剤で一時的に効果がある場合もありますが、侵入経路を封鎖しないと必ず戻ってきます。根本解決には専門業者による封鎖工事が必要です。' },
      { q: '施工後、すぐに効果が出ますか？', a: '侵入経路を封鎖した時点で新たな侵入は防げます。匂い等が残る場合は消臭処理で対応しますので、お気軽にご相談ください。' },
    ],
    freeLabel: '現地調査・お見積り無料',
  },

  nezumi: {
    icon: '🐀',
    title: 'ネズミ駆除',
    catch: '電線をかじって火災に…ネズミ被害は建物全体に及びます',
    color: '#6b7280',
    symptoms: [
      '天井・壁・床下から鳴き声や物音がする',
      '食品・袋・段ボールにかじり跡がある',
      '小さな黒いフンが点在している',
      '電線・断熱材・木材がかじられている',
      '悪臭がする',
      '油脂汚れ（ラットサイン）が壁や床にある',
    ],
    risks: [
      { icon: '🔥', title: '火災リスク', desc: '電線をかじることで漏電・火災につながるケースがあります。特に天井裏の配線は注意が必要です。' },
      { icon: '🦠', title: '感染症・食中毒リスク', desc: 'ネズミのフン・尿・体毛は食中毒菌・ウイルスを含みます。食品周りへの被害は特に危険です。' },
      { icon: '🏗️', title: '建物の損傷', desc: '断熱材・木材・配管をかじり、建物の断熱性能や耐久性を著しく低下させます。' },
    ],
    works: [
      { icon: '🔍', title: '調査・生息状況の把握', desc: '侵入経路・巣の場所・種類（クマネズミ・ドブネズミ等）を特定します。' },
      { icon: '🪤', title: '捕獲・駆除', desc: '粘着シート・捕獲器・毒餌等を状況に応じて組み合わせ、効果的に駆除します。' },
      { icon: '🚫', title: '侵入経路の封鎖', desc: '1cm程度の隙間も見逃さず、専用資材で完全に封鎖します。' },
      { icon: '🧹', title: '消毒・消臭処理', desc: 'フン・尿による汚染箇所を除去・消毒し、衛生的な環境に復元します。' },
    ],
    photos: [
      '/uploads/service-nezumi-1.png',
      '/uploads/service-nezumi-2.png',
    ],
    faqs: [
      { q: 'ネズミはどこから入ってくるのですか？', a: '排水管の隙間・外壁のひび割れ・換気口・屋根と壁の接合部など、わずか1〜2cmの隙間があれば侵入します。築年数が経った建物は要注意です。' },
      { q: 'スーパーで売っている殺鼠剤は効きますか？', a: '一時的な効果はありますが、侵入経路を塞がない限り次々と入り込みます。また、薬剤に慣れたネズミには効かない場合もあります。' },
      { q: '完全に駆除できますか？', a: '侵入経路の完全封鎖と駆除を組み合わせることで、再発を大幅に防ぐことができます。施工後も万が一の場合はご相談ください。' },
    ],
    freeLabel: '現地調査・お見積り無料',
  },

  hachi: {
    icon: '🐝',
    title: 'ハチ駆除',
    catch: '巣を見つけたら近づかないで。スズメバチは命に関わります',
    color: '#eab308',
    symptoms: [
      '軒下・屋根裏・庭木に巣がある',
      'ハチが頻繁に周辺を飛んでいる',
      'ハチに刺された・刺されそうになった',
      '屋根裏・天井から羽音がする',
      'アレルギーがあり、特に不安',
    ],
    risks: [
      { icon: '⚠️', title: 'アナフィラキシーショック', desc: 'ハチ毒アレルギーがある方は1刺しで命に関わる場合があります。過去に刺されたことがある方は特に注意が必要です。' },
      { icon: '👨‍👩‍👧', title: '家族・近隣への二次被害', desc: '巣に近づいたり刺激を与えると、集団で攻撃してきます。お子様・ご高齢者がいる場合は早急な対応が必要です。' },
      { icon: '🏠', title: '建物への営巣被害', desc: '屋根裏・壁の中に営巣すると、除去が困難になり建物内部へのダメージが広がります。' },
    ],
    works: [
      { icon: '🔍', title: '巣の場所・種類の特定', desc: 'スズメバチ・アシナガバチ・ミツバチ等、種類によって対応方法が異なります。安全に確認します。' },
      { icon: '🦺', title: '防護装備での安全な除去', desc: '専用の防護服を着用し、安全を確保した上で巣を完全に除去します。' },
      { icon: '🧴', title: '薬剤処理・再営巣防止', desc: '巣を除去した後、同じ場所に再び巣を作らせないよう処理を施します。' },
    ],
    photos: [
      '/uploads/service-hachi-1.png',
      '/uploads/service-hachi-2.png',
    ],
    faqs: [
      { q: 'スズメバチとアシナガバチの見分け方は？', a: 'スズメバチは体が大きく黄黒の模様が鮮明で、巣は丸みを帯びた提灯型です。アシナガバチはスリムで、巣は上からぶら下がったような逆さコップ型です。いずれも刺激しないでください。' },
      { q: '自分で市販のスプレーで退治できますか？', a: '小さな巣で女王蜂のみの時期（春先）なら可能な場合もありますが、夏〜秋の大きな巣は大変危険です。専門業者にお任せください。' },
      { q: '夜間・休日でも対応してもらえますか？', a: 'AI相談は24時間受付しております。緊急性の高い場合はAI相談よりご連絡ください。スタッフへ速やかに連携いたします。' },
    ],
    freeLabel: '現地調査・お見積り無料',
  },

  shiroari: {
    icon: '🪲',
    title: 'シロアリ防除',
    catch: '気づいた時には手遅れ…シロアリは「見えない場所」を食べ続ける',
    color: '#1a3a6e',
    symptoms: [
      '床を歩くとフカフカ・ミシミシする',
      '木材に穴や溝、粉のようなものがある',
      '春先に羽アリが大量発生した',
      '湿気が多く、カビや木の腐れが目立つ',
      '叩くと木が空洞のような音がする',
      '床下に白い虫（シロアリ）を見た',
    ],
    risks: [
      { icon: '🏚️', title: '家屋の倒壊リスク', desc: '土台・柱・梁など構造材を食い荒らすため、放置すると建物の耐震性・耐久性が著しく低下します。' },
      { icon: '📉', title: '資産価値の激減', desc: 'シロアリ被害が発覚すると不動産価値が大幅に下がり、売却時のトラブルにもつながります。' },
      { icon: '⏰', title: '被害は静かに広がる', desc: 'シロアリは表面に出てこないため気づきにくく、発見した時にはすでに広範囲に被害が及んでいるケースが多いです。' },
    ],
    works: [
      { icon: '🔦', title: '床下無料点検', desc: '専門スタッフが床下に入り、シロアリの生息状況・被害範囲・湿気状況を詳しく調査します。' },
      { icon: '💊', title: '薬剤処理による防除', desc: '土壌・木部への薬剤処理により、シロアリを駆除し再発を防ぎます。人体・ペットへの安全を確認した薬剤を使用。' },
      { icon: '🪵', title: '木部補強・防腐処理', desc: '被害を受けた木材の補強・防腐処理も対応しています。建物を長く守るためのご提案をいたします。' },
      { icon: '📋', title: '5年保証・定期点検', desc: '施工後は5年保証付き。年1回の定期点検で再発を早期発見します。' },
    ],
    photos: [
      '/uploads/service-shiroari-1.png',
      '/uploads/service-shiroari-2.png',
    ],
    faqs: [
      { q: 'シロアリとクロアリの見分け方は？', a: '春に羽アリが出た場合、胴体がくびれていればクロアリ、くびれていない寸胴体型であればシロアリです。また前後の翅の大きさが同じならシロアリの可能性が高いです。' },
      { q: '築何年から気をつけた方がいいですか？', a: '一般的に築5年以降からリスクが高まります。特に湿気が多い地域・床下換気が不十分な建物は早めの点検をおすすめします。' },
      { q: '保証内容を教えてください。', a: '施工後5年間、再発した場合は無料で再施工いたします。定期点検（年1回）とセットでご安心いただけます。詳細は担当スタッフにご確認ください。' },
    ],
    freeLabel: '床下点検・お見積り無料',
  },

  konchu: {
    icon: '🦟',
    title: '害虫駆除全般',
    catch: 'ゴキブリ・ダニ・トコジラミ…飲食店・医療施設にも対応',
    color: '#dc2626',
    symptoms: [
      'ゴキブリを室内で見かける',
      'ダニ・ノミによる刺され・かゆみがある',
      '起床時にベッドや布団に赤い斑点がある（トコジラミ）',
      '飲食店・厨房で衛生上の問題が気になる',
      'ムカデ・クモ・アリが大量に出る',
      '医療施設・福祉施設での衛生管理が必要',
    ],
    risks: [
      { icon: '🍽️', title: '食中毒・衛生リスク', desc: 'ゴキブリは食中毒菌・ウイルスを媒介します。飲食店では営業停止リスクにもつながります。' },
      { icon: '😷', title: 'アレルギー・健康被害', desc: 'ダニのフン・死骸はアレルギー・喘息の原因に。トコジラミは睡眠障害を引き起こします。' },
      { icon: '📢', title: '風評被害（飲食店・施設）', desc: '害虫の発生がSNSや口コミで拡散すると、店舗・施設の信頼に大きなダメージを与えます。' },
    ],
    works: [
      { icon: '🔍', title: '害虫の種類・発生源の特定', desc: '現地調査で害虫の種類・発生源・侵入経路を特定します。種類によって対応方法が異なります。' },
      { icon: '💊', title: '薬剤処理・駆除', desc: 'ベイト剤・薬剤散布・燻蒸処理など、害虫の種類・場所に合わせた方法で確実に駆除します。' },
      { icon: '🏥', title: '飲食店・医療施設対応', desc: '営業時間外での施工・食品衛生法に準じた薬剤使用など、業種に応じた配慮を行います。' },
      { icon: '📋', title: '定期管理プラン', desc: '再発防止のための定期点検・処理プランをご提案。常に清潔な環境を維持します。' },
    ],
    photos: [
      '/uploads/service-konchu-1.png',
      '/uploads/service-konchu-2.png',
    ],
    faqs: [
      { q: 'ゴキブリはどこから入ってくるのですか？', a: '排水管・換気口・段ボール・外食品の持ち込みなどが主な侵入経路です。特に飲食店は搬入口・排水溝周りの管理が重要です。' },
      { q: 'トコジラミとはどんな虫ですか？', a: 'ベッドバグとも呼ばれる吸血害虫で、ベッド・ソファ・壁の隙間に潜みます。市販品での完全駆除が難しく、専門業者による対応が推奨されます。' },
      { q: '飲食店の営業中でも施工できますか？', a: '原則として、薬剤処理は営業時間外に行います。お客様の営業スケジュールに合わせてご対応いたします。' },
    ],
    freeLabel: '現地調査・お見積り無料',
  },

  choryu: {
    icon: '🐦',
    title: '鳥獣対策',
    catch: 'コウモリ・鳩・カラス…フン害・騒音・感染症リスクに早期対応を',
    color: '#4b5563',
    symptoms: [
      '夕方になるとコウモリが家の周辺を飛んでいる',
      '屋根・ベランダに鳩が居着いている',
      '屋根裏からコウモリの鳴き声や羽音がする',
      'フンによる悪臭・汚れが気になる',
      'カラスがゴミを荒らす',
      'ムクドリの大群が騒音・フン害をもたらしている',
    ],
    risks: [
      { icon: '🦠', title: '感染症リスク', desc: 'コウモリ・鳩のフンには病原菌・カビ（クリプトコッカス等）が含まれ、吸引による感染リスクがあります。' },
      { icon: '💩', title: '悪臭・美観の損傷', desc: 'フンが積み重なると強烈な悪臭を放ち、外壁・屋根・車などを腐食させます。' },
      { icon: '🏠', title: '建物への影響', desc: 'コウモリが屋根裏に住み着くとフンが堆積し、天井材の腐食・崩落リスクにつながります。' },
    ],
    works: [
      { icon: '🔍', title: '調査・侵入経路の特定', desc: 'どこから侵入しているか、どの種類の鳥獣か、被害の状況を詳しく確認します。' },
      { icon: '🔒', title: '侵入口の封鎖', desc: 'コウモリなどが入り込む隙間を専用資材で塞ぎ、侵入を防ぎます。' },
      { icon: '🪤', title: 'ネット・忌避剤の設置', desc: '鳩・カラス等にはネット設置・スパイク・忌避剤により定着を防ぎます。' },
      { icon: '📜', title: '捕獲対応（許可取得済み）', desc: '一部の鳥獣は法律に基づく許可が必要です。当社は適切な許可を取得した上で捕獲対応も行います。' },
    ],
    photos: [
      '/uploads/service-choryu-1.png',
      '/uploads/service-choryu-2.png',
    ],
    faqs: [
      { q: 'コウモリは触っても大丈夫ですか？', a: '絶対に素手で触れないでください。コウモリは狂犬病類似ウイルスを保有する可能性があり、噛まれると危険です。また、コウモリは鳥獣保護法で保護されており、許可なく捕獲・殺傷することは違法です。' },
      { q: '鳩は追い払えばいなくなりますか？', a: '一時的に追い払っても、巣や休憩場所として認識した場所には必ず戻ってきます。ネット設置などの物理的な対策が有効です。' },
      { q: '法律上の問題はありますか？', a: 'コウモリ・鳩・カラスなどは鳥獣保護管理法により保護されており、許可なく捕獲・殺傷することは禁止されています。当社は適切な許可を取得した上で対応いたします。' },
    ],
    freeLabel: '現地調査・お見積り無料',
  },
}

// ─── 写真エリア（画像を配置したらそのまま表示） ────────────
function PhotoArea({ photos, title }: { photos: string[]; title: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      {photos.map((src, i) => (
        <div key={i} style={{ borderRadius: 12, overflow: 'hidden', background: '#e8eaf0', aspectRatio: '4/3', position: 'relative' }}>
          <img
            src={src}
            alt={`${title} 施工写真 ${i + 1}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={(e) => {
              // 画像が未配置の場合はプレースホルダーを表示
              const target = e.currentTarget
              target.style.display = 'none'
              const parent = target.parentElement
              if (parent && !parent.querySelector('.photo-placeholder')) {
                const ph = document.createElement('div')
                ph.className = 'photo-placeholder'
                ph.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:#9ca3af;font-size:13px;font-family:Noto Sans JP,sans-serif'
                ph.innerHTML = '<span style="font-size:32px">📷</span><span>施工写真（準備中）</span>'
                parent.appendChild(ph)
              }
            }}
          />
        </div>
      ))}
    </div>
  )
}

// ─── アコーディオンFAQ ────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details style={{ borderBottom: '1px solid #e8eaf0' }}>
      <summary style={{ padding: '16px 20px', fontSize: 15, fontWeight: 700, color: '#1a1a2e', cursor: 'pointer', listStyle: 'none', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: '50%', background: '#f5821f', color: '#fff', fontSize: 13, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Q</span>
        {q}
      </summary>
      <div style={{ display: 'flex', gap: 12, padding: '0 20px 16px' }}>
        <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: '50%', background: '#1a3a6e', color: '#fff', fontSize: 13, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>A</span>
        <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.85, margin: 0 }}>{a}</p>
      </div>
    </details>
  )
}

// ─── ページ本体 ──────────────────────────────────────────
export default function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const svc = SERVICES[slug]
  if (!svc) notFound()

  return (
    <>
      {/* ヘッダー */}
      <header style={{ background: '#1a3a6e', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(26,58,110,0.3)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: "'Noto Sans JP', sans-serif" }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 16, textDecoration: 'none' }}>
            <img src="/uploads/logo-main.png" alt="SunYou Next" style={{ height: 52, borderRadius: 8, padding: '4px 10px', background: '#fff' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)' }}>大崎市で創業40年。信頼と実績。</span>
              <span style={{ fontSize: 26, fontWeight: 900, color: '#fff', lineHeight: 1.25, letterSpacing: '0.01em' }}>「三友薬品消毒」が<span style={{ color: '#ffa04a' }}>「サンユー・ネクスト」</span></span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', textAlign: 'right' }}>と業務提携いたしました！</span>
            </div>
          </Link>
          <Link href="/" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>← トップページへ</Link>
        </div>
      </header>

      {/* ヒーローバナー */}
      <div style={{ background: `linear-gradient(135deg, #1a3a6e 0%, #2a5cbf 100%)`, padding: '36px 24px', textAlign: 'center', fontFamily: "'Noto Sans JP', sans-serif" }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>{svc.icon}</div>
        <div style={{ display: 'inline-block', background: svc.color, color: '#fff', fontSize: 12, fontWeight: 700, padding: '4px 18px', borderRadius: 20, letterSpacing: '0.1em', marginBottom: 14 }}>
          {svc.freeLabel}
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 900, color: '#fff', margin: '0 0 14px', lineHeight: 1.3 }}>{svc.title}</h1>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, maxWidth: 600, margin: '0 auto', lineHeight: 1.7 }}>{svc.catch}</p>
      </div>

      <main style={{ fontFamily: "'Noto Sans JP', sans-serif", background: '#f8f9fc' }}>

        {/* こんな症状ありませんか？ */}
        <section style={{ background: '#fff', padding: '36px 24px' }}>
          <div style={{ maxWidth: 860, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <div style={{ fontSize: 12, color: svc.color, letterSpacing: '0.15em', fontWeight: 700, marginBottom: 8 }}>SYMPTOMS</div>
              <h2 style={{ fontSize: 26, fontWeight: 900, color: '#1a3a6e', margin: 0 }}>こんな症状、ありませんか？</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
              {svc.symptoms.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#f8f9fc', border: `1.5px solid ${svc.color}30`, borderRadius: 10, padding: '14px 18px' }}>
                  <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: '50%', background: svc.color, color: '#fff', fontSize: 12, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</span>
                  <span style={{ fontSize: 14, color: '#374151', fontWeight: 500 }}>{s}</span>
                </div>
              ))}
            </div>
            <div style={{ background: `${svc.color}15`, border: `2px solid ${svc.color}`, borderRadius: 10, padding: '14px 24px', textAlign: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: svc.color }}>1つでも当てはまったら、すぐにご相談ください。放置するほど被害は広がります。</span>
            </div>
          </div>
        </section>

        {/* 放置するとどうなるか */}
        <section style={{ padding: '36px 24px', background: '#f8f9fc' }}>
          <div style={{ maxWidth: 860, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <div style={{ fontSize: 12, color: '#dc2626', letterSpacing: '0.15em', fontWeight: 700, marginBottom: 8 }}>RISKS</div>
              <h2 style={{ fontSize: 26, fontWeight: 900, color: '#1a3a6e', margin: 0 }}>放置すると、こうなります</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {svc.risks.map((r, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 14, padding: '28px 20px', textAlign: 'center', border: '1px solid #e8eaf0', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>{r.icon}</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#dc2626', marginBottom: 10 }}>{r.title}</div>
                  <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.8, margin: 0 }}>{r.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 施工写真 */}
        <section style={{ background: '#fff', padding: '36px 24px' }}>
          <div style={{ maxWidth: 860, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <div style={{ fontSize: 12, color: svc.color, letterSpacing: '0.15em', fontWeight: 700, marginBottom: 8 }}>GALLERY</div>
              <h2 style={{ fontSize: 26, fontWeight: 900, color: '#1a3a6e', margin: 0 }}>施工写真</h2>
            </div>
            <PhotoArea photos={svc.photos} title={svc.title} />
          </div>
        </section>

        {/* 対応内容 */}
        <section style={{ padding: '36px 24px', background: '#f8f9fc' }}>
          <div style={{ maxWidth: 860, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <div style={{ fontSize: 12, color: svc.color, letterSpacing: '0.15em', fontWeight: 700, marginBottom: 8 }}>SERVICE</div>
              <h2 style={{ fontSize: 26, fontWeight: 900, color: '#1a3a6e', margin: 0 }}>サンユー・ネクストの対応内容</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {svc.works.map((w, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 14, padding: '24px', border: '1px solid #e8eaf0', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 28, flexShrink: 0 }}>{w.icon}</span>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: '#1a3a6e', marginBottom: 8 }}>{w.title}</div>
                    <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.8, margin: 0 }}>{w.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ご依頼の流れ */}
        <section style={{ background: '#fff', padding: '36px 24px' }}>
          <div style={{ maxWidth: 860, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <div style={{ fontSize: 12, color: svc.color, letterSpacing: '0.15em', fontWeight: 700, marginBottom: 8 }}>FLOW</div>
              <h2 style={{ fontSize: 26, fontWeight: 900, color: '#1a3a6e', margin: 0 }}>ご依頼の流れ</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {[
                { icon: '🤖', step: 'STEP 01', title: 'AI受付・ご相談', desc: '24時間AIが受付。症状をお伝えください。' },
                { icon: '🔍', step: 'STEP 02', title: '無料現地調査', desc: '専門スタッフが現地で被害状況を確認。' },
                { icon: '📋', step: 'STEP 03', title: 'お見積り・説明', desc: '内容・費用を明確にご説明。ご納得の上で施工。' },
                { icon: '✅', step: 'STEP 04', title: '施工・アフター', desc: '迅速に施工。再発防止対策＋定期フォロー。' },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center', padding: '20px 12px', background: '#f8f9fc', borderRadius: 12 }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                  <div style={{ fontSize: 11, color: svc.color, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 6 }}>{s.step}</div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#1a3a6e', marginBottom: 8 }}>{s.title}</div>
                  <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.7, margin: 0 }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* よくある質問 */}
        <section style={{ padding: '36px 24px', background: '#f8f9fc' }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <div style={{ fontSize: 12, color: svc.color, letterSpacing: '0.15em', fontWeight: 700, marginBottom: 8 }}>FAQ</div>
              <h2 style={{ fontSize: 26, fontWeight: 900, color: '#1a3a6e', margin: 0 }}>よくある質問</h2>
            </div>
            <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid #e8eaf0', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
              {svc.faqs.map((faq, i) => <FaqItem key={i} q={faq.q} a={faq.a} />)}
            </div>
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Link href="/faq" style={{ fontSize: 13, color: '#1a3a6e', textDecoration: 'underline' }}>その他のよくある質問はこちら →</Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ background: 'linear-gradient(135deg, #1a3a6e, #2a5cbf)', padding: '36px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 10 }}>{svc.icon} {svc.title}のご相談は</div>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15, lineHeight: 1.8, marginBottom: 28 }}>
            AIオペレーター「佐藤結衣」が24時間いつでもお答えします。<br />
            現地調査・お見積りは無料です。まずはお気軽にご連絡ください。
          </p>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('openEstimate', {}))}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#f5821f', color: '#fff', fontWeight: 900, fontSize: 16, padding: '16px 40px', borderRadius: 50, border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(245,130,31,0.5)', fontFamily: "'Noto Sans JP', sans-serif" }}
          >
            <MessageCircle size={20} />
            AIに無料相談する
          </button>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 10 }}>
            🔒 音声はGoogle Gemini AIで処理されます。
            <Link href="/privacy" style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'underline', marginLeft: 4 }}>プライバシーポリシー</Link>
          </p>
        </section>
      </main>

      {/* フッター */}
      <footer style={{ background: '#0d2240', color: 'rgba(255,255,255,0.6)', textAlign: 'center', padding: '24px', fontSize: 13, fontFamily: "'Noto Sans JP', sans-serif" }}>
        <p>© 2026 SunYou Next LLC（サンユー・ネクスト合同会社）業務提携：三友薬品消毒 ｜ 宮城県大崎市</p>
      </footer>

      {/* 佐藤結衣モーダル */}
      <EstimateChatModal />
    </>
  )
}
