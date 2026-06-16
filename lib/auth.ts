// Lógica de autenticación edge-safe (sin `next/headers` ni `Buffer`),
// para poder usarse desde el middleware (edge runtime) y desde route handlers.
export const SESSION_COOKIE = 'admin_session'

function getSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET env var is required')
  return secret
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// Firma HMAC-SHA256 con Web Crypto (disponible en edge y node).
async function hmac(value: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(value))
  return toHex(sig)
}

/** Genera el token de sesión que se guarda en la cookie. */
export async function createSessionToken(): Promise<string> {
  const payload = 'admin'
  return `${payload}.${await hmac(payload)}`
}

/** Valida un token de sesión (verifica la firma). */
export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false
  const [payload, sig] = token.split('.')
  if (payload !== 'admin' || !sig) return false
  return sig === (await hmac(payload))
}

/** Comprueba la contraseña de admin contra la env var. */
export function checkPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return false
  return password === expected
}
