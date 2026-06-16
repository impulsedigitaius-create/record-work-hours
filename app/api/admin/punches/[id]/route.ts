import { NextResponse } from 'next/server'
import { deletePunch } from '@/lib/queries'
import { isAuthenticated } from '@/lib/auth-server'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  await deletePunch(Number(id))
  return NextResponse.json({ ok: true })
}
