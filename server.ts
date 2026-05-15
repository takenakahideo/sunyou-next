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
  return `あなたはサンユー・ネクストのAIオペレーター「佐藤結衣」です。
明るく親しみやすい受付スタッフとして、お客様の言葉に「はい」「承知しました」「ありがとうございます」などの短い相槌を自然に挟みながら、温かく寄り添うトーンで日本語のみで応対してください。

【最重要ルール】
毎ターン、必ず1回だけ update_state を呼ぶ。複数回呼んではいけない。
質問・選択肢表示・項目記録・見積もり計算をすべて1回の呼び出しにまとめること。

【起動時】
「${greeting}、サンユー・ネクストの佐藤結衣です」と話し、
update_state(question="ご用件をお選びください", choices="①害獣・害虫のご相談,②お問い合わせ,③その他")

【フロー分岐】
①または害虫・害獣の相談はフローA。②③またはその他はフローB。

【フローA：害虫・害獣相談 — 1項目ずつヒアリング】
毎ターン update_state を1回だけ呼ぶ。判明した項目はすべてまとめて含める。

1. 害獣・害虫の種類
   update_state(question="どのような害獣でお困りですか", choices="ハクビシン,ネズミ,ハチ,シロアリ,コウモリ等,その他")
   pest の値: hakubishin/nezumi/hachi/shiroari/tori/other

2. 種類判明後はsymptomとpestを含めて次の質問
   update_state(symptom="ハクビシン被害", pest="hakubishin", question="建物の種類を教えてください", choices="一戸建て,マンション・アパート,店舗・飲食店,農場・倉庫,その他")
   building の値: house/mansion/store/farm/other

3. 以降も同様に1回の呼び出しで更新＋次の質問
   床面積(area): xsmall/small/medium/large/xlarge
   choices: "10坪以下,11〜20坪,21〜30坪,31〜50坪,51坪以上"
   築年数(age): new/young/old/veryold
   choices: "10年未満,20〜30年,40〜50年,それ以上"
   増改築(renovation): none/yes/unknown
   choices: "なし,あり,不明"
   被害期間(duration): week/month/quarter/year
   choices: "1週間くらい,1ヶ月くらい,3ヶ月以上,1年以上"
   過去の対策(history): none/self/carpenter/pro
   choices: "なし,自分で対策,大工・工務店,駆除業者（効果なし）"

4. 7項目のヒアリングが終わったら update_state(question="少々お待ちください", choices="") を呼ぶ
   システムが自動で金額を計算し、ツール応答に金額と「【次の質問】お名前をカタカナで」のカンペが返ってくる。
   金額と現地調査の案内を読み上げたら、選択肢（「はい/いいえ」）は絶対に出さない。「ご希望されますか？」などの確認もしない。
   カンペに従い、そのままお名前のヒアリングに進む。

5. 連絡先ヒアリング（名前カタカナ→住所→電話番号）
   各項目が分かったら update_state に含めて次の質問へ
   名前・住所が1回で聞き取れなかった場合は「恐れ入りますが、画面のフォームからご入力いただけますか」と促してそのまま待つ。
   すべて揃ったら update_state(question="ありがとうございます。画面をご確認の上、送信ボタンを押してください", choices="")

【フローB：問い合わせ・その他】
内容を聞き update_state(memo=内容, question="...", choices="...")
答えられる内容（営業時間：AIで24時間・現地調査は平日9〜17時／対応エリア：宮城県全域）は即答。
それ以外は「担当者から折り返しさせていただきます」と伝え、名前と電話番号を聞く。

【ルール】
- 1ターンに update_state は必ず1回だけ。絶対に複数回呼ばない
- ユーザーが明示的に回答した項目のみ update_state に含める。回答を得ていない項目を推測・デフォルトで設定しない
- 直前のターンで設定済みの質問を再度繰り返さない
- 金額はシステムが自動で計算してツール応答に返す。AI自身で計算しない
- 1発言は1文・最大30文字。枕詞や復唱を入れず端的に聞く
- 相槌（「はい」「承知しました」）は質問の冒頭に1語だけ置いてよい。相槌単独では終わらず必ず質問とセットにする
- 直前の発言と同じ内容を繰り返さない
- 名前はカタカナ、symptomは日本語、住所は番地・建物名・部屋番号まで
- 補足・要望（電話希望時間など）は memo に記録
- 聞き取れなければ「もう一度、ゆっくり言って頂けますか」（最大2回）
- submit_inquiry は呼ばない`
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

    const ESTIMATE_KEYS = ['pest', 'building', 'area', 'age', 'renovation', 'duration', 'history'] as const
    const estState: Partial<Record<typeof ESTIMATE_KEYS[number], string>> = {}
    const contactState: { name?: string; address?: string; phone?: string } = {}
    let estimateShown = false
    let pendingReveal: { min: number; max: number; pest: string } | null = null

    const genAI = new GoogleGenAI({ apiKey })
    let session: Awaited<ReturnType<typeof genAI.live.connect>> | null = null

    genAI.live.connect({
      model: 'gemini-3.1-flash-live-preview',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Leda' },
          },
        },
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
          if (msg.serverContent?.turnComplete) {
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

                // 見積もり7項目を蓄積
                for (const key of ESTIMATE_KEYS) {
                  if (args[key] && args[key] !== 'unknown') estState[key] = args[key]
                }
                // 連絡先を蓄積
                if (args.name    && args.name    !== 'unknown') contactState.name    = args.name
                if (args.address && args.address !== 'unknown') contactState.address = args.address
                if (args.phone   && args.phone   !== 'unknown') contactState.phone   = args.phone

                const estimateReady = ESTIMATE_KEYS.every(k => !!estState[k])

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
                  } else if (!contactState.address) {
                    hint = '【次の質問】ご住所を番地まで'
                  } else if (!contactState.phone) {
                    hint = '【次の質問】お電話番号'
                  } else {
                    hint = '【次の発言】画面をご確認の上、送信ボタンを押してください'
                  }
                }

                // toolResponse 文字列の組み立て
                // 見積もり完了の最初のターンは結果のみ。連絡先カンペは次のターンから。
                const isFirstReveal = estimateReady && !!estimateResult && !estimateShown
                let toolOut: string
                if (isFirstReveal) {
                  estimateShown = true
                  pendingReveal = estimateResult!
                  const mn = Math.round(estimateResult!.min / 10000)
                  const mx = Math.round(estimateResult!.max / 10000)
                  toolOut = `あくまで仮のお見積金額となりますが、${mn}万円〜${mx}万円です。無料で現地調査ができますが、いかがですか 【次の質問】お名前をカタカナで`
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
