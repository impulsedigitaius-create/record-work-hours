// Zona horaria fija del sitio: Florida, EE.UU. (EST/EDT).
// Todas las fechas/horas se registran y muestran bajo esta zona,
// sin importar la zona del servidor (Vercel corre en UTC).
export const TZ = 'America/New_York'

/** Fecha de hoy en el sitio, formato YYYY-MM-DD. */
export function todaySite(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date) // en-CA -> YYYY-MM-DD
}

/** Timestamp actual en el sitio, formato YYYY-MM-DD HH:MM:SS. */
export function nowSite(date: Date = new Date()): string {
  const p = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date)
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? '00'
  const h = g('hour') === '24' ? '00' : g('hour')
  return `${g('year')}-${g('month')}-${g('day')} ${h}:${g('minute')}:${g('second')}`
}

/** Hora legible (HH:MM) en el sitio a partir de un timestamp "YYYY-MM-DD HH:MM:SS". */
export function timeFromTs(ts: string): string {
  return ts.slice(11, 16)
}

/** Convierte "YYYY-MM-DD HH:MM:SS" a milisegundos (tratado como hora local del sitio). */
export function tsToMs(ts: string): number {
  // Se interpreta de forma consistente para medir duraciones entre dos timestamps del sitio.
  return new Date(ts.replace(' ', 'T')).getTime()
}
