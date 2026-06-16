import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createEmployee, listEmployees } from '@/lib/queries'
import { isAuthenticated } from '@/lib/auth-server'

const createSchema = z.object({
  last_name: z.string().min(1),
  first_name: z.string().min(1),
  code: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional().nullable(),
  details: z.string().optional().nullable(),
  hourly_rate: z.coerce.number().min(0).optional().default(0),
})

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const employees = await listEmployees(true)
  return NextResponse.json({ employees })
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
  try {
    const { last_name, first_name } = parsed.data
    const id = await createEmployee({
      last_name,
      first_name,
      name: `${first_name} ${last_name}`,
      code: parsed.data.code,
      phone: parsed.data.phone,
      email: parsed.data.email ?? null,
      details: parsed.data.details ?? null,
      hourly_rate: parsed.data.hourly_rate ?? 0,
    })
    return NextResponse.json({ id }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.toLowerCase().includes('unique')) {
      return NextResponse.json({ error: 'Code already in use' }, { status: 409 })
    }
    console.error('[POST /api/employees]', msg)
    return NextResponse.json({ error: 'Database error: ' + msg }, { status: 500 })
  }
}
