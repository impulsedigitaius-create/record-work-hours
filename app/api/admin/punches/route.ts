import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getPunchesByEmployeeAndDate, insertPunch } from '@/lib/queries'
import { isAuthenticated } from '@/lib/auth-server'

const dateRe = /^\d{4}-\d{2}-\d{2}$/

function validTime(t: string) {
  if (!/^\d{2}:\d{2}$/.test(t)) return false
  const [h, m] = t.split(':').map(Number)
  return h >= 0 && h <= 23 && m >= 0 && m <= 59
}

const createSchema = z.object({
  employee_id: z.number().int().positive(),
  date: z.string().regex(dateRe),
  time: z.string().refine(validTime, { message: 'Invalid time' }),
  type: z.enum(['IN', 'BREAK_OUT', 'BREAK_IN', 'OUT']),
})

export async function GET(req: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { searchParams } = new URL(req.url)
  const employee_id = Number(searchParams.get('employee_id'))
  const date = searchParams.get('date') ?? ''
  if (!employee_id || !dateRe.test(date)) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 })
  }
  const punches = await getPunchesByEmployeeAndDate(employee_id, date)
  return NextResponse.json({ punches })
}

export async function POST(req: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  const { employee_id, date, time, type } = parsed.data
  const ts = `${date} ${time}:00`
  try {
    const id = await insertPunch({ employee_id, type, date, ts })
    return NextResponse.json({ ok: true, id })
  } catch {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
