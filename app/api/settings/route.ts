import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSettings, updateSettings } from '@/lib/queries'
import { isAuthenticated } from '@/lib/auth-server'

const schema = z.object({
  weekly_hours: z.coerce.number().min(0),
  working_days: z.coerce.number().int().min(1).max(7),
  overtime_multiplier: z.coerce.number().min(0),
})

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.json({ settings: await getSettings() })
}

export async function PUT(req: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  await updateSettings(parsed.data)
  return NextResponse.json({ ok: true })
}
