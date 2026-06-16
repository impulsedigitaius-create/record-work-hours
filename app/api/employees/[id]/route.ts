import { NextResponse } from 'next/server'
import { z } from 'zod'
import { deactivateEmployee, deleteEmployeePermanently, getEmployeeById, updateEmployee } from '@/lib/queries'
import { isAuthenticated } from '@/lib/auth-server'

const patchSchema = z.object({
  last_name: z.string().min(1).optional(),
  first_name: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  email: z.string().email().nullable().optional(),
  details: z.string().nullable().optional(),
  hourly_rate: z.coerce.number().min(0).optional(),
  active: z.union([z.literal(0), z.literal(1)]).optional(),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const body = await req.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
  try {
    const { last_name, first_name, ...rest } = parsed.data
    const update: Parameters<typeof updateEmployee>[1] = { ...rest }
    if (last_name !== undefined) update.last_name = last_name
    if (first_name !== undefined) update.first_name = first_name
    if (last_name !== undefined || first_name !== undefined) {
      const emp = await getEmployeeById(Number(id))
      if (!emp) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
      const ln = last_name ?? emp.last_name
      const fn = first_name ?? emp.first_name
      update.name = `${fn} ${ln}`
    }
    await updateEmployee(Number(id), update)
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.toLowerCase().includes('unique')) {
      return NextResponse.json({ error: 'Code already in use' }, { status: 409 })
    }
    console.error('[PATCH /api/employees/:id]', msg)
    return NextResponse.json({ error: 'Database error: ' + msg }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const { searchParams } = new URL(req.url)
  if (searchParams.get('permanent') === 'true') {
    await deleteEmployeePermanently(Number(id))
  } else {
    await deactivateEmployee(Number(id))
  }
  return NextResponse.json({ ok: true })
}
