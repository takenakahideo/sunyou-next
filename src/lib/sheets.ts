import { google } from 'googleapis'

export async function appendInquiryRow(data: Record<string, string | number | undefined>) {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!)
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  const sheets = google.sheets({ version: 'v4', auth })

  const row = [
    new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
    data.name ?? '',
    data.phone ?? '',
    data.postal ?? '',
    data.address ?? '',
    data.symptom ?? '',
    data.estimatePest ?? '',
    data.estimateMin ? `${Math.round(Number(data.estimateMin) / 10000)}万円` : '',
    data.estimateMax ? `${Math.round(Number(data.estimateMax) / 10000)}万円` : '',
    data.memo ?? '',
  ]

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.INQUIRY_SHEET_ID!,
    range: 'シート1!A:J',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  })
}
