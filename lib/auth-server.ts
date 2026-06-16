import { cookies } from 'next/headers'
import { SESSION_COOKIE, verifySessionToken } from './auth'

// Helper para route handlers / server components (node runtime).
// Lee la cookie de sesión y valida su firma.
export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies()
  return verifySessionToken(store.get(SESSION_COOKIE)?.value)
}
