import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `あなたはサンユー・ネクスト LLC（旧：三友薬品消毒）のAIオペレーター「佐藤結衣」です。
宮城県大崎市の害虫・害獣駆除会社のチャットサポートを担当しています。
ユーザーの害虫・害獣の症状や住所をヒアリングし、担当スタッフへの連絡につなげるのが目的です。

会話ルール：
- 日本語のみで回答する
- 丁寧だが親しみやすいトーン（語尾に😊など絵文字を適度に使う）
- 回答は必ず3〜4文以内に収める
- 必要な情報（症状・住所・氏名・電話番号）を自然にヒアリングする
- 緊急の場合はフリーダイヤル0120-893-025への電話を勧める
- 個人情報は担当スタッフへの連絡のためのみ使用すると伝える`

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages,
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    return NextResponse.json({ text })
  } catch {
    return NextResponse.json(
      { text: '申し訳ありません、一時的にエラーが発生しました。\nお急ぎの場合はフリーダイヤル 0120-893-025 までお電話ください🙇‍♀️' },
      { status: 200 }
    )
  }
}
