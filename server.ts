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
- 一度に複数の質問をしない`

// ─── 見積りモード システムプロンプト（動的生成）──────────────────
function buildEstimateSystemInstruction(greeting: string): string {
  return `あなたはサンユー・ネクストのAIオペレーター「佐藤結衣」です。日本語のみ。温かく寄り添うトーンで。

【起動時の挨拶】
接続直後は必ず「${greeting}！サンユー・ネクストの佐藤結衣です。本日はどのようなご用件でしょうか？」と話しかける。

【問い合わせ種別の判断】
お客様の最初の発言を聞き、以下のどちらかのフローに進む。

フローA: 害虫・害獣駆除の相談・見積もり依頼の場合
→ 下記の見積もりフロー（ステップ1〜11）へ進む。

フローB: 一般問い合わせ（料金以外・会社情報・営業時間・サービス確認など）の場合
1. 内容をしっかり聞く（1〜2文で確認）
2. 答えられる内容は即答する
   - 営業時間：AIによる24時間受付。現地調査は平日9時〜17時
   - 対応エリア：宮城県全域
   - 会社所在地：宮城県大崎市
3. 答えられない内容は折り返しのため連絡先を収集する
   show_choices(question="お名前をカタカナで教えてください",choices="")
   → update_display(name=カタカナ)
   show_choices(question="お電話番号を教えてください",choices="")
   → update_display(phone=...)
   「担当スタッフよりご連絡いたします。少々お待ちください。」
   → submit_inquiry(symptom="一般問い合わせ", name=..., address="（未収集）", phone=...)

【見積もりフロー】各質問前にshow_choicesを先に呼び、その後に話す。
1. show_choices(question="どのような害獣・害虫でお困りですか",choices="ハクビシン・タヌキ,ネズミ,ハチ,シロアリ,ゴキブリ等,コウモリ・鳩等")
2. update_display(symptom=日本語)→show_choices(question="建物の種類を教えてください",choices="一戸建て,マンション・アパート,店舗・飲食店,農場・倉庫,その他")
3. show_choices(question="床面積を教えてください",choices="10坪以下（33㎡）,11〜20坪（36〜66㎡）,21〜30坪（69〜99㎡）,31〜50坪（102〜165㎡）,51坪以上（168㎡〜）")
4. show_choices(question="築何年くらいですか",choices="10年未満,20〜30年,40〜50年,それ以上")
5. show_choices(question="増改築はありましたか",choices="なし,あり,不明")
6. show_choices(question="いつ頃から気になっていますか",choices="1週間くらい,1ヶ月くらい,3ヶ月以上,1年以上")
7. show_choices(question="過去に対策しましたか",choices="なし,自分で対策,大工・工務店,駆除業者（効果なし）")
8. finalize_estimate→金額を伝え間を置く→無料現地調査の案内→show_choices(question="お名前をカタカナで教えてください",choices="")
9. update_display(name=カタカナ)→show_choices(question="番地・建物名・部屋番号まで住所を教えてください",choices="")
10. update_display(address=...)→show_choices(question="お電話番号を教えてください",choices="")
11. update_display(phone=...)→「送信ボタンを押してください」

【ルール】
- 1発言1〜2文・50文字以内。1項目のみ
- 名前はカタカナ・symptomは日本語で記録
- 住所は番地・建物名・部屋番号まで
- 見積もりフロー中はsubmit_inquiryは呼ばない
- 確認画面後も音声訂正に応じてupdate_displayで修正する`
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

  httpServer.on('upgrade', (request, socket, head) => {
    const { pathname } = parse(request.url || '')
    if (pathname === '/api/gemini-live') {
      wss.handleUpgrade(request, socket, head, (ws) => wss.emit('connection', ws, request))
    } else if (pathname === '/api/gemini-estimate') {
      wssEstimate.handleUpgrade(request, socket, head, (ws) => wssEstimate.emit('connection', ws, request))
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
      model: 'gemini-2.5-flash-native-audio-latest',
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

    const genAI = new GoogleGenAI({ apiKey })
    let session: Awaited<ReturnType<typeof genAI.live.connect>> | null = null

    genAI.live.connect({
      model: 'gemini-2.5-flash-native-audio-latest',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Aoede' },
          },
        },
        systemInstruction: buildEstimateSystemInstruction(greeting),
        tools: [{
          functionDeclarations: [
            {
              name: 'finalize_estimate',
              description: '7項目が揃ったら呼び出す。ツール応答に金額が返るのでそれを使って見積りを伝える',
              parameters: {
                type: Type.OBJECT,
                properties: {
                  pest:       { type: Type.STRING, description: 'hakubishin/nezumi/hachi/shiroari/konchu/tori' },
                  building:   { type: Type.STRING, description: 'house/mansion/store/farm/other' },
                  area:       { type: Type.STRING, description: 'xsmall(10坪以下)/small(11〜20坪)/medium(21〜30坪)/large(31〜50坪)/xlarge(51坪以上)' },
                  age:        { type: Type.STRING, description: 'new(10年未満)/young(20〜30年)/old(40〜50年)/veryold(それ以上)' },
                  renovation: { type: Type.STRING, description: 'none/yes/unknown' },
                  duration:   { type: Type.STRING, description: 'week/month/quarter/year' },
                  history:    { type: Type.STRING, description: 'none/self/carpenter/pro' },
                },
                required: ['pest'],
              },
            },
            {
              name: 'update_display',
              description: '各項目が1つでも確認できたら即座に呼び出す',
              parameters: {
                type: Type.OBJECT,
                properties: {
                  symptom: { type: Type.STRING, description: '被害の症状・種類' },
                  name:    { type: Type.STRING, description: 'お客様の氏名（カタカナ）' },
                  postal:  { type: Type.STRING, description: 'お客様の郵便番号（任意）' },
                  address: { type: Type.STRING, description: 'お客様の住所' },
                  phone:   { type: Type.STRING, description: 'お客様の電話番号' },
                },
                required: [],
              },
            },
            {
              name: 'show_choices',
              description: '各ターンで質問を発する直前に呼ぶ。questionに質問文、choicesに選択肢をカンマ区切りで入れる',
              parameters: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING, description: '質問文' },
                  choices:  { type: Type.STRING, description: '選択肢をカンマ区切りで。なければ空文字' },
                },
                required: ['question'],
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
            send({ type: 'turnComplete' })
          }
          if (msg.toolCall?.functionCalls) {
            for (const fc of msg.toolCall.functionCalls) {
              console.log(`[Gemini Estimate] toolCall: ${fc.name}`, JSON.stringify(fc.args))
              send({ type: 'toolCall', id: fc.id, name: fc.name, args: fc.args })
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
          turns: [{ role: 'user', parts: [{ text: '（AIオペレーターに接続しました）' }] }],
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

    clientWs.on('close', () => {
      console.log('[Gemini Estimate] クライアント切断')
      try { session?.close() } catch { /* ignore */ }
    })

    clientWs.on('error', (err) => {
      console.error('[Gemini Estimate] ❌ WS エラー:', err.message)
      try { session?.close() } catch { /* ignore */ }
    })
  })

  httpServer.listen(port, () => {
    console.log(`> サンユー・ネクスト ready → http://${hostname}:${port}`)
  })
})
