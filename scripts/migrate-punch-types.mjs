// Migration: expand punches.type CHECK constraint to include BREAK_OUT and BREAK_IN
// SQLite doesn't support ALTER COLUMN, so we recreate the table.

import { createClient } from '@libsql/client'

const client = createClient({
  url: 'libsql://loxlifecamps-shiftlog-impulsedigitai.aws-us-west-2.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODA5NDMzNzUsImlkIjoiMDE5ZWE4N2UtNWQwMS03NzdiLWE5MmQtZjUyOWY2ODk2ZTBlIiwicmlkIjoiNDkxNmUxY2MtNTY0OS00ZjM1LWEzODAtNzBjYjlkYzk5MDhiIn0.ruy83U9M_sP6SK7eFWCgDauNlzJhdn_hU0dJ5J2mtj9rMASMLmFkFVjDY7XriRDjPwp92m6yNaNLKMm_Y4l-Bg',
})

const steps = [
  // Create replacement table with updated CHECK constraint
  `CREATE TABLE IF NOT EXISTS punches_new (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id   INTEGER NOT NULL REFERENCES employees(id),
    type          TEXT NOT NULL CHECK(type IN ('IN','BREAK_OUT','BREAK_IN','OUT')),
    date          TEXT NOT NULL,
    ts            TEXT NOT NULL,
    synced_sheets INTEGER NOT NULL DEFAULT 0
  )`,
  // Copy existing data
  `INSERT INTO punches_new SELECT * FROM punches`,
  // Swap tables
  `DROP TABLE punches`,
  `ALTER TABLE punches_new RENAME TO punches`,
  // Recreate indexes
  `CREATE INDEX IF NOT EXISTS idx_punch_emp_date ON punches(employee_id, date)`,
  `CREATE INDEX IF NOT EXISTS idx_punch_date ON punches(date)`,
]

for (const sql of steps) {
  console.log('▶', sql.slice(0, 60).replace(/\n/g, ' ') + '…')
  await client.execute(sql)
  console.log('  ✓ done')
}

console.log('\nMigration complete.')
