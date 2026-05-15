import { NextRequest, NextResponse } from 'next/server'
import { appendInquiryRow } from '@/lib/sheets'

interface InquiryData {
  symptom: string
  name: string
  address: string
  phone: string
  postal?: string
  memo?: string
  estimatePest?: string
  estimateMin?: number
  estimateMax?: number
  building?: string
  area?: string
  age?: string
  renovation?: string
  duration?: string
  history?: string
}

const BUILDING_LABEL: Record<string, string> = {
  house: '一戸建て', mansion: 'マンション・アパート',
  store: '店舗・飲食店', farm: '農場・倉庫', other: 'その他',
}
const AREA_LABEL: Record<string, string> = {
  small: '30㎡以下', medium: '30〜80㎡', large: '80〜150㎡', xlarge: '150㎡以上',
}
const AGE_LABEL: Record<string, string> = {
  new: '10年未満', young: '20〜30年', old: '40〜50年', veryold: 'それ以上', unknown: '不明',
}
const RENOVATION_LABEL: Record<string, string> = {
  none: 'なし', yes: 'あり', unknown: '不明',
}
const DURATION_LABEL: Record<string, string> = {
  week: '1週間くらい', month: '1ヶ月くらい', quarter: '3ヶ月以上', year: '1年以上',
}
const HISTORY_LABEL: Record<string, string> = {
  none: 'なし', self: '自分で対策', carpenter: '大工・工務店', pro: '駆除業者（効果なし）',
}

async function sendLineNotification(data: InquiryData, timestamp: string) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  const userId = process.env.LINE_USER_ID
  if (!token || !userId) return

  const estimateLine = data.estimatePest && data.estimateMin && data.estimateMax
    ? `見積（簡易）: ${data.estimatePest} ${Math.round(data.estimateMin / 10000)}万円〜${Math.round(data.estimateMax / 10000)}万円`
    : null

  const lines = [
    '📩 新規お問い合わせ',
    '━━━━━━━━━━━━━━',
    `受付: ${timestamp}`,
    `お名前: ${data.name}`,
    `電話: ${data.phone}`,
    data.postal ? `郵便番号: ${data.postal}` : null,
    `住所: ${data.address}`,
    data.memo ? `備考: ${data.memo}` : null,
    '━━━━━━━━━━━━━━',
    '【アンケート結果】',
    `被害内容: ${data.symptom}`,
    data.building   ? `建物種類: ${BUILDING_LABEL[data.building]   ?? data.building}`   : null,
    data.area       ? `床面積: ${AREA_LABEL[data.area]             ?? data.area}`         : null,
    data.age        ? `築年数: ${AGE_LABEL[data.age]               ?? data.age}`         : null,
    data.renovation ? `増改築: ${RENOVATION_LABEL[data.renovation] ?? data.renovation}`  : null,
    data.duration   ? `被害期間: ${DURATION_LABEL[data.duration]   ?? data.duration}`    : null,
    data.history    ? `対策経験: ${HISTORY_LABEL[data.history]     ?? data.history}`     : null,
    estimateLine,
    '━━━━━━━━━━━━━━',
  ].filter(Boolean).join('\n')

  await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      to: userId,
      messages: [{ type: 'text', text: lines }],
    }),
  })
}

export async function POST(req: NextRequest) {
  try {
    const data: InquiryData = await req.json()

    // バリデーション
    if (!data.name?.trim() || !data.phone?.trim()) {
      return NextResponse.json({ success: false, message: '名前と電話番号は必須です' }, { status: 400 })
    }

    const timestamp = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })

    console.log('\n========== 新規お問い合わせ受付 ==========')
    console.log(`受付時刻 : ${timestamp}`)
    console.log(`お名前   : ${data.name}`)
    console.log(`郵便番号 : ${data.postal ?? '未入力'}`)
    console.log(`ご住所   : ${data.address}`)
    console.log(`電話番号 : ${data.phone}`)
    console.log(`症状     : ${data.symptom}`)
    if (data.estimatePest) console.log(`見積     : ${data.estimatePest} ${data.estimateMin}〜${data.estimateMax}円`)
    console.log('==========================================\n')

    // Sheets保存（最優先・失敗したら500）
    await appendInquiryRow({ ...data })

    // LINE通知（副次的・失敗してもOK）
    try {
      await sendLineNotification(data, timestamp)
    } catch (err) {
      console.error('[LINE通知] 失敗（データはSheets保存済み）:', err)
    }

    return NextResponse.json({
      success: true,
      message: '受注データを登録しました',
      timestamp,
    })
  } catch (err) {
    console.error('[/api/inquiry] エラー:', err)
    return NextResponse.json({ success: false, message: '登録に失敗しました' }, { status: 500 })
  }
}
