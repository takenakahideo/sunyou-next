import { createServer } from 'node:http'
import { parse } from 'node:url'
import next from 'next'
import { WebSocketServer, WebSocket } from 'ws'
import { GoogleGenAI, Modality, Type } from '@google/genai'

const dev      = process.env.NODE_ENV !== 'production'
const hostname = dev ? 'localhost' : '0.0.0.0'
const port     = parseInt(process.env.PORT || '3000', 10)

// ─── 佐藤結衣 システムプロンプト ─────────────────────────────
const SYSTEM_INSTRUCTION = `あなたはサンユー・ネクスト（宮城県大崎市の害虫・害獣駆除会社）のAI受付オペレーター「佐藤結衣」です。
明るく丁寧な日本の女性オペレーターとして振る舞い、お客様に寄り添う温かいトーンで対応してください。すべての返答を日本語で行ってください。

【会話の流れ — 必ずこの順番で進めること】

ステップ1: 挨拶
「こちらはサンユー・ネクストでございます。お電話ありがとうございます。本日はどのようなお困りごとでしょうか？」

ステップ2: ヒアリング（1ターンに1項目ずつ）
以下の4項目を自然な会話の中で揃える：
- 被害の症状（害虫・害獣の種類と被害内容）
- お名前
- ご住所（市区町村まで）
- お電話番号

ステップ3: 最終確認（必須 — 絶対にスキップしないこと）
4項目が揃ったら必ずこの形で確認する：
「確認させていただきます。[症状]の被害で、[名前]様、[住所]にお住まいで、電話番号は[電話番号]でよろしいでしょうか？」
→ お客様が「はい」「合ってます」など肯定したら、はじめて次へ進む。
→ 絶対にステップ3を飛ばして submit_inquiry を呼んではいけない。

ステップ4: 登録・クロージング
確認が取れたら submit_inquiry を呼び出す。
その後「ほかにご用件はございますか？」と聞く。
用件がなければ「それでは、改めて担当者からご連絡させていただきます。お電話ありがとうございました。」と伝えて終了する。

【リアルタイム表示ルール】
- 各項目（症状・名前・住所・電話番号）が1つでも確認できたら、即座に update_display を呼び出す
- update_display は会話を止めず、バックグラウンドで呼んでよい
- ステップ3の最終確認は「画面の内容をご確認ください」の一言だけでよい。口頭での全項目読み上げは不要

【ルール】
- 1回の発言は1〜2文（最大50文字）に収めること
- 住所・症状などをそのまま復唱しない（最終確認はステップ3の一言のみ）
- 一度に複数の質問をしない
- お客様の言葉が聞き取れなかった場合は「もう一度、ゆっくり言って頂けますか？」と聞き返す。同一発言への聞き返しは最大2回まで。2回聞いても聞き取れない場合は聞き取れた範囲で進める`

// ─── 見積もり計算テーブル（サーバー主導カンペ用）──────────────────────
const EST_CENTER: Record<string, number> = {
  hakubishin: 150000, nezumi: 80000, hachi: 28000, shiroari: 220000, tori: 100000, other: 80000,
}
const EST_SPREAD: Record<string, number> = {
  hakubishin: 30000, nezumi: 15000, hachi: 8000, shiroari: 40000, tori: 20000, other: 20000,
}
const EST_LABEL: Record<string, string> = {
  hakubishin: 'ハクビシン', nezumi: 'ネズミ', hachi: 'ハチ', shiroari: 'シロアリ', tori: 'コウモリ等', other: 'その他害獣・害虫',
}
const EST_MULT = {
  building:   { house: 1.0, mansion: 0.85, store: 1.2,  farm: 1.15, other: 1.0 }  as Record<string, number>,
  area:       { xsmall: 0.75, small: 0.85, medium: 1.0, large: 1.15, xlarge: 1.3 } as Record<string, number>,
  age:        { new: 0.9, young: 1.0, old: 1.1, veryold: 1.25, unknown: 1.0 }      as Record<string, number>,
  renovation: { none: 1.0, yes: 1.05, unknown: 1.0 }                               as Record<string, number>,
  duration:   { week: 0.95, month: 1.0, quarter: 1.1, year: 1.2 }                  as Record<string, number>,
  history:    { none: 1.0, self: 1.05, carpenter: 1.1, pro: 1.2 }                  as Record<string, number>,
}

function calcEstimateServer(pest: string, building?: string, area?: string, age?: string, renovation?: string, duration?: string, history?: string) {
  const center = EST_CENTER[pest] ?? 100000
  const spread = EST_SPREAD[pest] ?? 20000
  const m = (EST_MULT.building[building   ?? 'house']   ?? 1.0)
           * (EST_MULT.area[area           ?? 'medium']  ?? 1.0)
           * (EST_MULT.age[age             ?? 'unknown'] ?? 1.0)
           * (EST_MULT.renovation[renovation ?? 'unknown'] ?? 1.0)
           * (EST_MULT.duration[duration   ?? 'month']   ?? 1.0)
           * (EST_MULT.history[history     ?? 'none']    ?? 1.0)
  return {
    min:  Math.round((center * m - spread) / 10000) * 10000,
    max:  Math.round((center * m + spread) / 10000) * 10000,
    pest: EST_LABEL[pest] ?? pest,
  }
}

// ─── 見積りモード システムプロンプト ─────────────────────────────

function buildEstimateSystemInstruction(greeting: string): string {
  return `あなたはサンユー・ネクスト（宮城県大崎市の害虫・害獣駆除会社）のAI受付オペレーター「佐藤結衣」です。
明るく親しみやすい受付スタッフとして、お客様の言葉に「はい」「承知しました」「ありがとうございます」などの短い相槌を自然に挟みながら、温かく寄り添うトーンで日本語のみで応対してください。

【最重要ルール】
毎ターン、必ず1回だけ update_state を呼ぶ。複数回呼ばない。

【起動時】
「${greeting}、サンユー・ネクストの佐藤結衣です」と話し、
update_state(question="どのようなご用件でしょうか？")

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【最初の判定：3つのフローに振り分け】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

お客様の最初の発言から判定する。

▼フローA（仮見積もり） — メイン
害獣・害虫の被害を相談する発言（「ハクビシンが」「ネズミが出て」「天井から音が」など）。

▼お客様が以下のいずれかを言った場合も、フローAに誘導する：
- 「無料現地調査をお願いしたい」「現地調査が欲しい」「直接見て欲しい」
- 「正式な見積もりが欲しい」「ちゃんとした見積もりをください」
- 「前に仮見積もりを取ったので正式見積もりを取りたい」
→ こう返答する：「恐れ入ります。もう一度仮のお見積りを出してから手続きに入りますね」
→ そのままフローAの必須4項目ヒアリングに進む。担当者が金額情報を把握する必要があるため、必ず仮見積もりを取ってから連絡先を聞く。

▼フローB（一般問い合わせ）
質問・営業時間・対応エリア・料金感などの問い合わせ。

【会話の作法】
- 画面に選択肢ボタンは出ない。質問はYES/NO型や具体的な聞き方にする。「お選びください」「種類を教えてください」は禁止
- 1発言は1〜2文・端的に
- お客様の自由発言（症状の詳細・心情）は symptom と memo に記録する
- 自分から会話を打ち切らない。受付完了まで継続する
- 聞き取れない時は「もう一度ゆっくりお願いできますか？」（最大2回）

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【フローA：仮見積もり】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

必須4項目を必ず聞く。「わからない」と言われたら**最大2回まで**ヒントを変えて聞き直す。
2回聞いてもわからなければ、推定的に判断して記録し、次へ進む。

【必須4項目】

1. 害獣・害虫の種類
   質問例：「どのような害獣でお困りでしょうか？」
   pest の値: hakubishin/nezumi/hachi/shiroari/tori/other

2. 建物の種類
   質問例：「建物は一戸建てでしょうか？」（YES/NO型）
   building の値: house/mansion/store/farm/other

3. 床面積
   質問例：「だいたい何坪くらいですか？平米でも構いません」
   1回目「わからない」→「○DKくらいでしょうか？」「2階建てですか？」と推定的に聞く
   2回目「わからない」→「およそで結構です。20坪くらい？50坪くらい？」と二択で
   area の値: xsmall(10坪以下)/small(11〜20坪)/medium(21〜30坪)/large(31〜50坪)/xlarge(51坪以上)

4. 築年数
   質問例：「築何年くらいになりますか？」
   1回目「わからない」→「だいたい新しい・古いどちらでしょうか？」
   2回目「わからない」→「30年以上経っていますか？」とYES/NOで推定
   age の値: new(10年未満)/young(20〜30年)/old(40〜50年)/veryold(それ以上)

【見積もり計算】
必須4項目が揃ったら update_state(question="少々お待ちください") を呼ぶ。
システムが自動で計算し、ツール応答で「仮のお見積もり金額は○○万円〜○○万円です。あくまで仮のお見積りなので…」という指示文が返る。
**その指示文をそのまま読み上げる**こと。AIで勝手に変えない。

【金額提示後の分岐】
金額を読み上げ「いかがでしょうか」と聞いたら、お客様の返事を待つ。

▼お客様が肯定的（「はい」「お願いします」「現地調査して欲しい」「お願いしたい」等）
→ 「ありがとうございます。それではお名前をカタカナで教えていただけますか？」
→ お名前 → 電話番号 → ご住所の順でヒアリング
→ すべて揃ったら update_state(question="ありがとうございます。画面の内容をご確認の上、送信ボタンを押してください")
→ お客様が送信ボタンを押すまで「送信ボタンを押してください」と促し続ける

▼お客様が否定的（「結構です」「考えます」「また今度」「いりません」等）
→ 「承知しました。是非ご検討くださいませ。お電話ありがとうございました」
→ それ以上ヒアリングしない・送信しない

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【フローB：一般問い合わせ】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

質問内容を聞き memo に記録。
- FAQ即答可能（営業時間：AIで24時間・現地調査は平日9〜17時／対応エリア：宮城県全域）
- それ以外は「担当者から折り返します」→ 名前・電話番号 → 送信

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【共通：データ記録ルール】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- symptom: 害獣被害の症状を端的に記録（例：「天井裏から足音」）
- memo: 自由発言・心情・補足情報を要約して記録（サーバーで「・」区切り蓄積）
  - **重要：同じmemo内容を複数ターンに渡って繰り返し送らない。新しい情報があった時だけmemoを更新する**
  - **既に記録済みの内容と同じ内容や部分一致するものは送らない（サーバー側で重複検知するが念のため）**
- name: カタカナで記録
- 連絡先ヒアリングで1回聞き取れなかったら「恐れ入りますが、画面のフォームからご入力いただけますか」と促す
- 直前のターンと同じ質問を繰り返さない`
}

// ─── Next.js セットアップ ──────────────────────────────────
const app    = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      await handle(req, res, parse(req.url!, true))
    } catch (err) {
      console.error('Request error:', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  const wss         = new WebSocketServer({ noServer: true })
  const wssEstimate = new WebSocketServer({ noServer: true })
  const wssPreview  = new WebSocketServer({ noServer: true })

  httpServer.on('upgrade', (request, socket, head) => {
    const { pathname } = parse(request.url || '')
    if (pathname === '/api/gemini-live') {
      wss.handleUpgrade(request, socket, head, (ws) => wss.emit('connection', ws, request))
    } else if (pathname === '/api/gemini-estimate') {
      wssEstimate.handleUpgrade(request, socket, head, (ws) => wssEstimate.emit('connection', ws, request))
    } else if (pathname === '/api/voice-preview') {
      wssPreview.handleUpgrade(request, socket, head, (ws) => wssPreview.emit('connection', ws, request))
    }
  })

  // ─── WebSocket 接続ハンドラ ────────────────────────────────
  wss.on('connection', (clientWs) => {
    // ① 環境変数チェック
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error('[Gemini Live] GEMINI_API_KEY が設定されていません。.env.local を確認してください。')
      clientWs.send(JSON.stringify({ type: 'error', message: 'GEMINI_API_KEY が設定されていません' }))
      clientWs.close()
      return
    }

    console.log('[Gemini Live] クライアント接続 — APIキー確認OK')

    const send = (msg: unknown) => {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify(msg))
      }
    }

    const genAI = new GoogleGenAI({ apiKey })
    let session: Awaited<ReturnType<typeof genAI.live.connect>> | null = null

    // ② Gemini Live セッション開始
    console.log('[Gemini Live] Gemini セッション接続中...')
    genAI.live.connect({
      model: 'gemini-3.1-flash-live-preview',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Aoede' },
          },
        },
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{
          functionDeclarations: [
            {
              name: 'update_display',
              description: '1項目でも確認できたら即座に呼び出す。画面にリアルタイム表示してカスタマーが目視確認できるようにする',
              parameters: {
                type: Type.OBJECT,
                properties: {
                  symptom: { type: Type.STRING, description: '被害の症状（確認済みのもの）' },
                  name:    { type: Type.STRING, description: 'お客様の氏名（確認済みのもの）' },
                  address: { type: Type.STRING, description: 'お客様の住所（確認済みのもの）' },
                  phone:   { type: Type.STRING, description: 'お客様の電話番号（確認済みのもの）' },
                },
                required: [],
              },
            },
            {
              name: 'submit_inquiry',
              description: '全4項目が揃い、お客様が画面の内容を確認・承諾したときのみ呼び出す。受注データを登録する',
              parameters: {
                type: Type.OBJECT,
                properties: {
                  symptom: { type: Type.STRING, description: '被害の症状' },
                  name:    { type: Type.STRING, description: 'お客様の氏名' },
                  address: { type: Type.STRING, description: 'お客様の住所' },
                  phone:   { type: Type.STRING, description: 'お客様の電話番号' },
                },
                required: ['symptom', 'name', 'address', 'phone'],
              },
            },
          ],
        }],
      },
      callbacks: {
        onopen: () => {
          console.log('[Gemini Live] ✅ Gemini セッション確立 → クライアントに ready 送信')
          send({ type: 'ready' })
        },
        onmessage: (msg) => {
          // 音声出力
          const parts = msg.serverContent?.modelTurn?.parts
          if (parts) {
            for (const part of parts) {
              const d = part.inlineData
              if (d?.mimeType?.startsWith('audio/pcm') && d.data) {
                send({ type: 'audio', data: d.data, mimeType: d.mimeType })
              }
            }
          }
          // ターン完了
          if (msg.serverContent?.turnComplete) {
            send({ type: 'turnComplete' })
          }
          // Function Calling
          if (msg.toolCall?.functionCalls) {
            for (const fc of msg.toolCall.functionCalls) {
              send({ type: 'toolCall', id: fc.id, name: fc.name, args: fc.args })
            }
          }
        },
        onerror: (e: ErrorEvent) => {
          console.error('[Gemini Live] ❌ Gemini エラー:', e.message, e.error ?? '')
          send({ type: 'error', message: e.message })
          if (clientWs.readyState < WebSocket.CLOSING) clientWs.close()
        },
        onclose: (e: CloseEvent) => {
          console.error(
            `[Gemini Live] ⚠️ Gemini セッション切断 — code: ${e.code}, reason: "${e.reason || '(なし)'}", wasClean: ${e.wasClean}`
          )
          if (clientWs.readyState < WebSocket.CLOSING) clientWs.close()
        },
      },
    }).then(s => {
      session = s
      console.log('[Gemini Live] session オブジェクト取得完了')
      // 接続直後に起動テキストを送り、結衣に自動で挨拶させる
      try {
        session.sendClientContent({
          turns: [{ role: 'user', parts: [{ text: '（電話が繋がりました）' }] }],
          turnComplete: true,
        })
      } catch (e) {
        console.warn('[Gemini Live] 起動テキスト送信失敗:', e)
      }
    }).catch(err => {
      console.error('[Gemini Live] ❌ Gemini 接続失敗:', err)
      send({ type: 'error', message: String(err) })
      clientWs.close()
    })

    // ─── クライアント → Gemini ──────────────────────────────
    clientWs.on('message', (data) => {
      if (!session) {
        console.warn('[Gemini Live] session未初期化のためメッセージ破棄')
        return
      }
      let msg: Record<string, unknown>
      try { msg = JSON.parse(data.toString('utf-8')) } catch { return }

      if (msg.type === 'audio') {
        session.sendRealtimeInput({
          audio: { data: msg.data as string, mimeType: 'audio/pcm;rate=16000' },
        })
      } else if (msg.type === 'toolResponse') {
        session.sendToolResponse({
          functionResponses: [{
            id:       msg.id as string,
            name:     msg.name as string,
            response: { output: msg.output as string },
          }],
        })
      }
    })

    clientWs.on('close', (code, reason) => {
      const r = reason?.toString('utf-8') || '(なし)'
      console.log(`[Gemini Live] クライアント切断 — code: ${code}, reason: "${r}"`)
      try { session?.close() } catch { /* ignore */ }
    })

    clientWs.on('error', (err) => {
      console.error('[Gemini Live] ❌ クライアント WS エラー:', err.message)
      try { session?.close() } catch { /* ignore */ }
    })
  })

  // ─── 見積りモード WebSocket ────────────────────────────────
  wssEstimate.on('connection', (clientWs) => {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      clientWs.send(JSON.stringify({ type: 'error', message: 'GEMINI_API_KEY が設定されていません' }))
      clientWs.close()
      return
    }

    console.log('[Gemini Estimate] クライアント接続')

    // JST時刻で時間帯挨拶を決定
    const nowJST = new Date(Date.now() + 9 * 60 * 60 * 1000)
    const hour = nowJST.getUTCHours()
    const greeting =
      hour >= 5 && hour < 11 ? 'おはようございます' :
      hour >= 11 && hour < 18 ? 'こんにちは' : 'こんばんは'

    const send = (msg: unknown) => {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify(msg))
      }
    }

    // 必須4項目：これがないと見積もり不可
    const REQUIRED_KEYS = ['pest', 'building', 'area', 'age'] as const
    const MISSING_LABEL: Record<string, string> = {
      pest: '害獣の種類', building: '建物の種類', area: '床面積', age: '築年数',
    }
    // 計算用の全項目（任意項目は不問・デフォルト乗数1.0で計算）
    const ESTIMATE_KEYS = ['pest', 'building', 'area', 'age', 'renovation', 'duration', 'history'] as const
    const estState: Partial<Record<typeof ESTIMATE_KEYS[number], string>> = {}
    const contactState: { name?: string; address?: string; phone?: string; memo?: string } = {}
    let estimateShown = false
    let pendingReveal: { min: number; max: number; pest: string } | null = null

    const genAI = new GoogleGenAI({ apiKey })
    let session: Awaited<ReturnType<typeof genAI.live.connect>> | null = null

    // お客様の音声書き起こしを時系列で蓄積
    const customerTranscripts: string[] = []
    let pendingTranscript = ''

    genAI.live.connect({
      model: 'gemini-3.1-flash-live-preview',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Leda' },
          },
        },
        inputAudioTranscription: {},
        systemInstruction: buildEstimateSystemInstruction(greeting),
        tools: [{
          functionDeclarations: [
            {
              name: 'update_state',
              description: 'Call exactly once per turn. Combines question display, choice options, and data recording into one call.',
              parameters: {
                type: Type.OBJECT,
                properties: {
                  question:   { type: Type.STRING, description: 'Question to ask the customer' },
                  choices:    { type: Type.STRING, description: 'Comma-separated choices. Empty string if none' },
                  symptom:    { type: Type.STRING, description: 'Pest damage description in Japanese' },
                  name:       { type: Type.STRING, description: 'Customer name in katakana' },
                  address:    { type: Type.STRING, description: 'Customer address including building and room number' },
                  phone:      { type: Type.STRING, description: 'Customer phone number' },
                  memo:       { type: Type.STRING, description: 'Additional notes or requests' },
                  pest:       { type: Type.STRING, description: 'Pest type. Use exactly one of: hakubishin, nezumi, hachi, shiroari, tori, other' },
                  building:   { type: Type.STRING, description: 'Building type. Use exactly one of: house, mansion, store, farm, other' },
                  area:       { type: Type.STRING, description: 'Floor area. Use exactly one of: xsmall, small, medium, large, xlarge' },
                  age:        { type: Type.STRING, description: 'Building age. Use exactly one of: new, young, old, veryold, unknown' },
                  renovation: { type: Type.STRING, description: 'Renovation history. Use exactly one of: none, yes, unknown' },
                  duration:   { type: Type.STRING, description: 'Problem duration. Use exactly one of: week, month, quarter, year' },
                  history:    { type: Type.STRING, description: 'Prior extermination attempts. Use exactly one of: none, self, carpenter, pro' },
                },
                required: [],
              },
            },
          ],
        }],
      },
      callbacks: {
        onopen: () => {
          console.log('[Gemini Estimate] ✅ セッション確立')
          send({ type: 'ready' })
        },
        onmessage: (msg) => {
          const parts = msg.serverContent?.modelTurn?.parts
          if (parts) {
            for (const part of parts) {
              const d = part.inlineData
              if (d?.mimeType?.startsWith('audio/pcm') && d.data) {
                send({ type: 'audio', data: d.data, mimeType: d.mimeType })
              }
              if (part.text) {
                send({ type: 'yui_text', text: part.text })
              }
            }
          }
          // お客様の音声書き起こし（inputAudioTranscription）
          const inputTrans = (msg.serverContent as { inputTranscription?: { text?: string } })?.inputTranscription
          if (inputTrans?.text) {
            pendingTranscript += inputTrans.text
          }
          if (msg.serverContent?.turnComplete) {
            // ターン完了時、お客様の発言をまとめてリストに追加
            const cleaned = pendingTranscript.trim()
            // ハングル文字（U+AC00-U+D7AF, U+1100-U+11FF, U+3130-U+318F）が含まれていたら除外
            const hasHangul = /[가-힯ᄀ-ᇿ㄰-㆏]/.test(cleaned)
            if (cleaned.length > 1 && !hasHangul) {
              customerTranscripts.push(cleaned)
              send({ type: 'customerTranscript', transcripts: [...customerTranscripts] })
              console.log(`[Gemini Estimate] 📝 お客様: ${cleaned}`)
            } else if (hasHangul) {
              console.log(`[Gemini Estimate] 🚫 韓国語誤認識のため除外: ${cleaned}`)
            }
            pendingTranscript = ''
            if (pendingReveal) {
              send({ type: 'turnComplete', estimateReveal: pendingReveal })
              pendingReveal = null
            } else {
              send({ type: 'turnComplete' })
            }
          }
          if (msg.toolCall?.functionCalls) {
            for (const fc of msg.toolCall.functionCalls) {
              console.log(`[Gemini Estimate] toolCall: ${fc.name}`, JSON.stringify(fc.args))
              if (fc.name === 'update_state') {
                const args = fc.args as Record<string, string>

                // 必須項目：unknownは保存しない（聞き直す必要あり）
                for (const key of REQUIRED_KEYS) {
                  if (args[key] && args[key] !== 'unknown') estState[key] = args[key]
                }
                // 連絡先を蓄積
                if (args.name    && args.name    !== 'unknown') contactState.name    = args.name
                if (args.address && args.address !== 'unknown') contactState.address = args.address
                if (args.phone   && args.phone   !== 'unknown') contactState.phone   = args.phone

                // memo は追記（既存に「・」で連結）— 重複・部分一致は追記しない
                if (args.memo && args.memo !== 'unknown') {
                  const newMemo = args.memo.trim()
                  const existing = contactState.memo ?? ''
                  // 既存memoに既に含まれている / 直前と同一の場合はスキップ
                  if (!existing.includes(newMemo)) {
                    contactState.memo = existing ? `${existing}・${newMemo}` : newMemo
                  }
                }

                const estimateReady = REQUIRED_KEYS.every(k => !!estState[k])

                // 見積もり計算
                let estimateResult: { min: number; max: number; pest: string } | undefined
                if (estimateReady) {
                  estimateResult = calcEstimateServer(
                    estState.pest!, estState.building, estState.area,
                    estState.age, estState.renovation, estState.duration, estState.history,
                  )
                }

                // カンペ生成（見積もり完了後のみ）— 端的な指示
                let hint = ''
                if (estimateReady) {
                  if (!contactState.name) {
                    hint = '【次の質問】お名前をカタカナで'
                  } else if (!contactState.phone) {
                    hint = '【次の質問】お電話番号'
                  } else if (!contactState.address) {
                    hint = '【次の質問】ご住所を番地まで'
                  } else {
                    hint = '【次の発言】画面をご確認の上、送信ボタンを押してください'
                  }
                }

                // toolResponse 文字列の組み立て
                // 見積もり完了の最初のターンは結果のみ。連絡先カンペは次のターンから。
                const isFirstReveal = estimateReady && !!estimateResult && !estimateShown
                const isCalcRequest = /お待ち|計算|見積/.test(args.question ?? '')
                let toolOut: string
                if (isFirstReveal) {
                  estimateShown = true
                  pendingReveal = estimateResult!
                  const mn = Math.round(estimateResult!.min / 10000)
                  const mx = Math.round(estimateResult!.max / 10000)
                  toolOut = `仮のお見積もり金額は ${mn}万円〜${mx}万円 です。あくまで仮のお見積りなので、正式なお見積りには無料現地調査が必要です。いかがでしょうか`
                } else if (isCalcRequest && !estimateReady) {
                  // 計算しようとしたが必須項目不足 — 足りない項目を返してAIに聞き直させる
                  const missing = REQUIRED_KEYS.filter(k => !estState[k]).map(k => MISSING_LABEL[k])
                  toolOut = `【未確認のため計算できません】${missing.join('・')}を確認してください`
                } else {
                  toolOut = `ok${hint ? ' ' + hint : ''}`
                }

                console.log(`[Gemini Estimate] toolOut: ${toolOut}`)

                // UIへ更新情報を送信（初回は estimateResult を省いて音声完了まで隠す）
                send({
                  type: 'uiUpdate',
                  args: fc.args,
                  estimateReady,
                  estimateResult: isFirstReveal ? undefined : estimateResult,
                  contactState: { ...contactState },
                  estState: { ...estState },
                })

                // Geminiへ直接 toolResponse を送信（サーバー主導）
                if (session) {
                  try {
                    session.sendToolResponse({
                      functionResponses: [{ id: fc.id as string, name: fc.name, response: { output: toolOut } }],
                    })
                    console.log('[Gemini Estimate] toolResponse送信OK, id:', fc.id)
                  } catch (e) {
                    console.error('[Gemini Estimate] toolResponse送信失敗:', e)
                  }

                  // ※ 以前は isFirstReveal で追加プロンプトを送っていたが、復唱の原因になるため削除。
                  // toolResponse の指示文だけでAIに読み上げさせる。
                } else {
                  console.warn('[Gemini Estimate] session未初期化のためtoolResponse送信スキップ')
                }
              } else {
                send({ type: 'toolCall', id: fc.id, name: fc.name, args: fc.args })
              }
            }
          }
        },
        onerror: (e: ErrorEvent) => {
          console.error('[Gemini Estimate] ❌ エラー:', e.message)
          send({ type: 'error', message: e.message })
          if (clientWs.readyState < WebSocket.CLOSING) clientWs.close()
        },
        onclose: (e: CloseEvent) => {
          console.warn(`[Gemini Estimate] ⚠️ セッション切断 — code: ${e.code}, reason: "${e.reason || '(なし)'}"`)
          if (clientWs.readyState < WebSocket.CLOSING) clientWs.close()
        },
      },
    }).then(s => {
      session = s
      try {
        session.sendClientContent({
          turns: [{ role: 'user', parts: [{ text: 'start' }] }],
          turnComplete: true,
        })
      } catch (e) {
        console.warn('[Gemini Estimate] 起動テキスト送信失敗:', e)
      }
    }).catch(err => {
      console.error('[Gemini Estimate] ❌ 接続失敗:', err)
      send({ type: 'error', message: String(err) })
      clientWs.close()
    })

    clientWs.on('message', (data) => {
      if (!session) return
      let msg: Record<string, unknown>
      try { msg = JSON.parse(data.toString('utf-8')) } catch { return }

      if (msg.type === 'audio') {
        session.sendRealtimeInput({
          audio: { data: msg.data as string, mimeType: 'audio/pcm;rate=16000' },
        })
      } else if (msg.type === 'text') {
        try {
          session.sendClientContent({
            turns: [{ role: 'user', parts: [{ text: msg.text as string }] }],
            turnComplete: true,
          })
        } catch (e) {
          console.warn('[Gemini Estimate] テキスト送信失敗:', e)
        }
      }
    })

    clientWs.on('close', () => {
      console.log('[Gemini Estimate] クライアント切断')
      try { session?.close() } catch { /* ignore */ }
    })

    clientWs.on('error', (err) => {
      console.error('[Gemini Estimate] ❌ WS エラー:', err.message)
      try { session?.close() } catch { /* ignore */ }
    })
  })

  // ─── 声試聴モード WebSocket ────────────────────────────────
  const ALLOWED_VOICES = new Set([
    'Aoede', 'Leda', 'Despina', 'Kore', 'Autonoe', 'Erinome',
    'Laomedeia', 'Pulcherrima', 'Vindemiatrix', 'Zephyr', 'Puck', 'Charon',
  ])

  wssPreview.on('connection', (clientWs, request) => {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) { clientWs.close(); return }

    const url   = new URL(request.url ?? '/', 'http://localhost')
    const voice = url.searchParams.get('voice') ?? 'Aoede'
    if (!ALLOWED_VOICES.has(voice)) { clientWs.close(); return }

    console.log(`[Voice Preview] クライアント接続 — voice: ${voice}`)
    const send = (msg: unknown) => {
      if (clientWs.readyState === WebSocket.OPEN) clientWs.send(JSON.stringify(msg))
    }

    const genAI = new GoogleGenAI({ apiKey })
    let session: Awaited<ReturnType<typeof genAI.live.connect>> | null = null

    genAI.live.connect({
      model: 'gemini-3.1-flash-live-preview',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
        systemInstruction:
          'あなたはサンユー・ネクストの受付AI「佐藤結衣」です。日本語で、明るく親しみやすいトーンで、以下の挨拶のみを話してください：' +
          '「こんにちは、サンユー・ネクストの佐藤結衣です。本日はどんなご用件でしょうか」',
      },
      callbacks: {
        onopen: () => { send({ type: 'ready' }) },
        onmessage: (msg) => {
          const parts = msg.serverContent?.modelTurn?.parts
          if (parts) {
            for (const part of parts) {
              const d = part.inlineData
              if (d?.mimeType?.startsWith('audio/pcm') && d.data) {
                send({ type: 'audio', data: d.data })
              }
            }
          }
          if (msg.serverContent?.turnComplete) send({ type: 'turnComplete' })
        },
        onerror: (e: ErrorEvent) => { send({ type: 'error', message: e.message }); clientWs.close() },
        onclose: () => { if (clientWs.readyState < WebSocket.CLOSING) clientWs.close() },
      },
    }).then(s => {
      session = s
      try {
        s.sendClientContent({ turns: [{ role: 'user', parts: [{ text: '挨拶' }] }], turnComplete: true })
      } catch { /* ignore */ }
    }).catch(err => {
      console.error('[Voice Preview] 接続失敗:', err)
      clientWs.close()
    })

    clientWs.on('close', () => { try { session?.close() } catch { /* ignore */ } })
  })

  httpServer.listen(port, () => {
    console.log(`> サンユー・ネクスト ready → http://${hostname}:${port}`)
  })
})
