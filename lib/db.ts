import { createClient, type Client } from '@libsql/client'

// Cliente Turso / LibSQL. Turso es la única fuente de verdad.
// Inicialización perezosa: el cliente se crea en la primera consulta, no al
// importar el módulo. Así `next build` (que evalúa los módulos para recolectar
// datos de página) no falla cuando las env vars aún no están disponibles.
let client: Client | null = null

function getClient(): Client {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL
    if (!url) throw new Error('TURSO_DATABASE_URL is not set')
    client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN })
  }
  return client
}

// Proxy que difiere la creación del cliente hasta el primer acceso a un método.
const db = new Proxy({} as Client, {
  get(_target, prop, receiver) {
    const value = Reflect.get(getClient(), prop, receiver)
    return typeof value === 'function' ? value.bind(getClient()) : value
  },
})

export default db
