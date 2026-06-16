import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  getEmployeeByCode,
  getLastPunchToday,
  insertPunch,
  markPunchSynced,
} from '@/lib/queries'
import { todaySite, nowSite, timeFromTs } from '@/lib/timezone'
import { sendToSheets } from '@/lib/sheets'
import { NEXT_PUNCHES } from '@/lib/punch-sequence'

const schema = z.object({
  code: z.string().min(1),
  type: z.enum(['IN', 'BREAK_OUT', 'BREAK_IN', 'OUT']),
})

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const employee = await getEmployeeByCode(parsed.data.code)
  if (!employee) {
    return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 })
  }

  const date = todaySite()
  const ts = nowSite()

  const last = await getLastPunchToday(employee.id, date)
  const lastKey = last?.type ?? 'null'
  const allowed = NEXT_PUNCHES[lastKey] ?? ['IN']

  if (!allowed.includes(parsed.data.type)) {
    return NextResponse.json(
      { error: `Not allowed. Valid next actions: ${allowed.join(', ')}`, allowed },
      { status: 409 },
    )
  }

  let punchId: number
  try {
    punchId = await insertPunch({ employee_id: employee.id, type: parsed.data.type, date, ts })
  } catch {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  sendToSheets({
    fecha: date,
    nombre: employee.name,
    area: employee.details ?? '',
    hora: timeFromTs(ts),
    tipo: parsed.data.type,
  })
    .then(() => markPunchSynced(punchId))
    .catch(() => {})

  return NextResponse.json({ type: parsed.data.type, time: timeFromTs(ts), date })
}
