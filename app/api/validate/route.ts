import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getEmployeeByCode, getLastPunchToday } from '@/lib/queries'
import { todaySite } from '@/lib/timezone'
import { NEXT_PUNCHES } from '@/lib/punch-sequence'

const schema = z.object({ code: z.string().min(1) })

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

  const last = await getLastPunchToday(employee.id, todaySite())
  const lastKey = last?.type ?? 'null'
  const nextTypes = NEXT_PUNCHES[lastKey] ?? ['IN']

  return NextResponse.json({
    employee: { id: employee.id, name: employee.name, photo_url: employee.photo_url },
    nextTypes,
  })
}
