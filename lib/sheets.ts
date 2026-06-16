// Respaldo opcional a Google Sheets (fire-and-forget).
// Si falla o no está configurado, NUNCA rompe ni bloquea el fichaje.
const WEBHOOK_URL = process.env.SHEETS_WEBHOOK_URL

export async function sendToSheets(row: Record<string, unknown>): Promise<void> {
  if (!WEBHOOK_URL) return // sin webhook -> se omite el respaldo
  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(row),
    })
    if (!res.ok) console.error(`[sheets] HTTP ${res.status}`)
  } catch (err) {
    console.error('[sheets] respaldo falló:', err)
  }
}
