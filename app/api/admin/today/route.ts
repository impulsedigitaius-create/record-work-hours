import { NextResponse } from 'next/server'
import { getEmployeesTodayStatus } from '@/lib/queries'
import { isAuthenticated } from '@/lib/auth-server'
import { todaySite } from '@/lib/timezone'

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const date = todaySite()
  const employees = await getEmployeesTodayStatus(date)
  return NextResponse.json({ employees, date })
}
