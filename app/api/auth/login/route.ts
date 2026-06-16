import { NextResponse } from 'next/server'
import { z } from 'zod'
import { checkPassword, createSessionToken, SESSION_COOKIE } from '@/lib/auth'

const schema = z.object({ password: z.string().min(1) })

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  if (!checkPassword(parsed.data.password)) {
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 })
  }

  const token = await createSessionToken()
  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12, // 12 horas
  })
  return res
}
