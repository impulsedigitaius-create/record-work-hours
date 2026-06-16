import db from './db'
import type { Employee, Punch, PunchType, Settings } from './types'

// ---------- Empleados ----------

export async function listEmployees(includeInactive = true): Promise<Employee[]> {
  const sql = includeInactive
    ? 'SELECT * FROM employees ORDER BY active DESC, last_name ASC, first_name ASC'
    : 'SELECT * FROM employees WHERE active = 1 ORDER BY last_name ASC, first_name ASC'
  const res = await db.execute(sql)
  return res.rows as unknown as Employee[]
}

export async function getEmployeeByCode(code: string): Promise<Employee | null> {
  const res = await db.execute({
    sql: 'SELECT * FROM employees WHERE code = ? AND active = 1 LIMIT 1',
    args: [code],
  })
  return (res.rows[0] as unknown as Employee) ?? null
}

export async function getEmployeeById(id: number): Promise<Employee | null> {
  const res = await db.execute({
    sql: 'SELECT * FROM employees WHERE id = ? LIMIT 1',
    args: [id],
  })
  return (res.rows[0] as unknown as Employee) ?? null
}

export async function createEmployee(data: {
  last_name: string
  first_name: string
  name: string
  code: string
  phone: string
  email: string | null
  details: string | null
  hourly_rate: number
}): Promise<number> {
  const res = await db.execute({
    sql: 'INSERT INTO employees (last_name, first_name, name, code, phone, email, details, hourly_rate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    args: [data.last_name, data.first_name, data.name, data.code, data.phone, data.email, data.details, data.hourly_rate],
  })
  return Number(res.lastInsertRowid)
}

export async function updateEmployee(
  id: number,
  data: Partial<{ last_name: string; first_name: string; name: string; code: string; phone: string; email: string | null; details: string | null; hourly_rate: number; active: number }>,
): Promise<void> {
  const fields: string[] = []
  const args: (string | number | null)[] = []
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined) continue
    fields.push(`${k} = ?`)
    args.push(v as string | number | null)
  }
  if (fields.length === 0) return
  args.push(id)
  await db.execute({
    sql: `UPDATE employees SET ${fields.join(', ')} WHERE id = ?`,
    args,
  })
}

/** Baja lógica: marca inactivo en vez de borrar (conserva historial de fichajes). */
export async function deactivateEmployee(id: number): Promise<void> {
  await db.execute({ sql: 'UPDATE employees SET active = 0 WHERE id = ?', args: [id] })
}

/** Borrado permanente: elimina empleado y todos sus fichajes de la base de datos. */
export async function deleteEmployeePermanently(id: number): Promise<void> {
  await db.batch([
    { sql: 'DELETE FROM punches WHERE employee_id = ?', args: [id] },
    { sql: 'DELETE FROM employees WHERE id = ?', args: [id] },
  ])
}

// ---------- Fichajes ----------

/** Último fichaje de HOY de un empleado (para decidir IN/OUT). */
export async function getLastPunchToday(employeeId: number, date: string): Promise<Punch | null> {
  const res = await db.execute({
    sql: `SELECT * FROM punches WHERE employee_id = ? AND date = ?
          ORDER BY ts DESC, id DESC LIMIT 1`,
    args: [employeeId, date],
  })
  return (res.rows[0] as unknown as Punch) ?? null
}

export async function insertPunch(data: {
  employee_id: number
  type: PunchType
  date: string
  ts: string
}): Promise<number> {
  const res = await db.execute({
    sql: 'INSERT INTO punches (employee_id, type, date, ts) VALUES (?, ?, ?, ?)',
    args: [data.employee_id, data.type, data.date, data.ts],
  })
  return Number(res.lastInsertRowid)
}

export async function markPunchSynced(id: number): Promise<void> {
  await db.execute({ sql: 'UPDATE punches SET synced_sheets = 1 WHERE id = ?', args: [id] })
}

export async function getPunchesByEmployeeAndDate(employeeId: number, date: string): Promise<Punch[]> {
  const res = await db.execute({
    sql: 'SELECT * FROM punches WHERE employee_id = ? AND date = ? ORDER BY ts ASC, id ASC',
    args: [employeeId, date],
  })
  return res.rows as unknown as Punch[]
}

export async function deletePunch(id: number): Promise<void> {
  await db.execute({ sql: 'DELETE FROM punches WHERE id = ?', args: [id] })
}

export interface EmployeeTodayStatus {
  id: number
  last_name: string
  first_name: string
  name: string
  last_type: PunchType | null
  last_ts: string | null
}

export async function getEmployeesTodayStatus(date: string): Promise<EmployeeTodayStatus[]> {
  const res = await db.execute({
    sql: `SELECT
            e.id, e.last_name, e.first_name, e.name,
            (SELECT type FROM punches WHERE employee_id = e.id AND date = ? ORDER BY ts DESC, id DESC LIMIT 1) AS last_type,
            (SELECT ts   FROM punches WHERE employee_id = e.id AND date = ? ORDER BY ts DESC, id DESC LIMIT 1) AS last_ts
          FROM employees e
          WHERE e.active = 1
          ORDER BY e.last_name ASC, e.first_name ASC`,
    args: [date, date],
  })
  return res.rows as unknown as EmployeeTodayStatus[]
}

/** Todos los fichajes en un rango de fechas (inclusive). */
export async function getPunchesInRange(from: string, to: string): Promise<Punch[]> {
  const res = await db.execute({
    sql: `SELECT * FROM punches WHERE date >= ? AND date <= ?
          ORDER BY employee_id ASC, ts ASC, id ASC`,
    args: [from, to],
  })
  return res.rows as unknown as Punch[]
}

// ---------- Ajustes globales ----------

export async function getSettings(): Promise<Settings> {
  const res = await db.execute('SELECT weekly_hours, working_days, overtime_multiplier FROM settings WHERE id = 1')
  const row = res.rows[0] as unknown as Settings | undefined
  return row ?? { weekly_hours: 40, working_days: 5, overtime_multiplier: 1.5 }
}

export async function updateSettings(data: Settings): Promise<void> {
  await db.execute({
    sql: `INSERT INTO settings (id, weekly_hours, working_days, overtime_multiplier)
          VALUES (1, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            weekly_hours = excluded.weekly_hours,
            working_days = excluded.working_days,
            overtime_multiplier = excluded.overtime_multiplier`,
    args: [data.weekly_hours, data.working_days, data.overtime_multiplier],
  })
}
