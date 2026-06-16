import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getPunchesInRange, getSettings, listEmployees } from '@/lib/queries'
import { calculatePayroll } from '@/lib/payroll'
import { isAuthenticated } from '@/lib/auth-server'

const dateRe = /^\d{4}-\d{2}-\d{2}$/
const schema = z.object({
  from: z.string().regex(dateRe),
  to: z.string().regex(dateRe),
})

export async function GET(req: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { searchParams } = new URL(req.url)
  const parsed = schema.safeParse({
    from: searchParams.get('from'),
    to: searchParams.get('to'),
  })
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid date range' }, { status: 400 })
  }
  const { from, to } = parsed.data

  try {
    const [employees, punches, settings] = await Promise.all([
      listEmployees(false),
      getPunchesInRange(from, to),
      getSettings(),
    ])
    const rows = calculatePayroll(employees, punches, settings, from, to)
    return NextResponse.json({ rows, settings, from, to })
  } catch {
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
