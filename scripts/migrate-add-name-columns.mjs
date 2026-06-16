/**
 * Migration: add last_name, first_name columns if missing.
 * Splits existing `name` ("First Last") into first_name + last_name.
 * Safe to run multiple times — uses IF NOT EXISTS / checks before altering.
 */

import { createClient } from '@libsql/client'

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

async function run() {
  // Check which columns exist
  const info = await db.execute("PRAGMA table_info(employees)")
  const cols = info.rows.map(r => r[1]) // column names
  console.log('Current columns:', cols)

  if (!cols.includes('last_name')) {
    console.log('Adding last_name column...')
    await db.execute("ALTER TABLE employees ADD COLUMN last_name TEXT NOT NULL DEFAULT ''")
  }
  if (!cols.includes('first_name')) {
    console.log('Adding first_name column...')
    await db.execute("ALTER TABLE employees ADD COLUMN first_name TEXT NOT NULL DEFAULT ''")
  }

  // Populate from name if columns were empty
  const employees = await db.execute("SELECT id, name FROM employees WHERE last_name = '' OR first_name = ''")
  console.log(`Populating ${employees.rows.length} employees from 'name' field...`)

  for (const row of employees.rows) {
    const id = row[0]
    const name = String(row[1] ?? '').trim()
    const parts = name.split(' ')
    const first_name = parts[0] ?? ''
    const last_name = parts.slice(1).join(' ') || first_name
    await db.execute({
      sql: "UPDATE employees SET first_name = ?, last_name = ? WHERE id = ?",
      args: [first_name, last_name, id],
    })
    console.log(`  id=${id} → first="${first_name}" last="${last_name}"`)
  }

  console.log('Migration complete.')
  process.exit(0)
}

run().catch(err => { console.error(err); process.exit(1) })
