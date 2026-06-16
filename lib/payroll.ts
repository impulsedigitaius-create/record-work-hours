import type { Employee, Punch, Settings, PayrollRow } from './types'
import { tsToMs } from './timezone'

const MS_PER_HOUR = 1000 * 60 * 60

/** Suma de días laborables esperados en un rango [from, to] inclusive.
 *  Asume días laborables a partir del lunes según `working_days`
 *  (p. ej. 5 -> Lun-Vie, 6 -> Lun-Sáb). */
export function countWorkingDays(from: string, to: string, workingDays: number): number {
  const start = new Date(`${from}T00:00:00`)
  const end = new Date(`${to}T00:00:00`)
  if (end < start) return 0
  let count = 0
  const cur = new Date(start)
  while (cur <= end) {
    // getDay(): 0=Dom, 1=Lun, ... 6=Sáb. Mapear a 1..7 con Lun=1.
    const dow = cur.getDay() === 0 ? 7 : cur.getDay()
    if (dow <= workingDays) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

/** Empareja segmentos de trabajo (IN/BREAK_IN → BREAK_OUT/OUT) por empleado/fecha.
 *  Break time no cuenta como horas trabajadas. */
function pairShifts(punches: Punch[]): { workedHours: number; openShifts: number } {
  const byDate = new Map<string, Punch[]>()
  for (const p of punches) {
    const arr = byDate.get(p.date) ?? []
    arr.push(p)
    byDate.set(p.date, arr)
  }
  let workedMs = 0
  let openShifts = 0
  for (const dayPunches of byDate.values()) {
    const sorted = [...dayPunches].sort((a, b) => a.ts.localeCompare(b.ts))
    let openIn: Punch | null = null
    for (const p of sorted) {
      const isStart = p.type === 'IN' || p.type === 'BREAK_IN'
      const isEnd   = p.type === 'OUT' || p.type === 'BREAK_OUT'
      if (isStart) {
        if (openIn) openShifts++
        openIn = p
      } else if (isEnd) {
        if (openIn) {
          workedMs += tsToMs(p.ts) - tsToMs(openIn.ts)
          openIn = null
        }
      }
    }
    if (openIn) openShifts++
  }
  return { workedHours: Math.max(0, workedMs / MS_PER_HOUR), openShifts }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * Calcula la nómina por empleado para un rango de fechas.
 *
 * Fórmula (modelo por hora):
 *   expectedDaily = weekly_hours / working_days
 *   expectedHours = expectedDaily * (días laborables en el rango)
 *   overtimeHours = max(0, worked - expected)
 *   regularHours  = worked - overtimeHours
 *   shortfallHours = max(0, expected - worked)   // atrasos / ausencias
 *   basePay      = regularHours * rate
 *   overtimePay  = overtimeHours * rate * overtime_multiplier
 *   totalPay     = basePay + overtimePay
 *
 * El déficit (atrasos/salidas anticipadas) se refleja como menos horas pagadas;
 * se reporta `shortfallHours` para transparencia.
 */
export function calculatePayroll(
  employees: Employee[],
  punches: Punch[],
  settings: Settings,
  from: string,
  to: string,
): PayrollRow[] {
  const expectedDaily =
    settings.working_days > 0 ? settings.weekly_hours / settings.working_days : 0
  const expectedHours = round2(expectedDaily * countWorkingDays(from, to, settings.working_days))

  // Agrupar fichajes por empleado.
  const byEmp = new Map<number, Punch[]>()
  for (const p of punches) {
    const arr = byEmp.get(p.employee_id) ?? []
    arr.push(p)
    byEmp.set(p.employee_id, arr)
  }

  return employees.map((emp) => {
    const { workedHours, openShifts } = pairShifts(byEmp.get(emp.id) ?? [])
    const worked = round2(workedHours)
    const overtimeHours = round2(Math.max(0, worked - expectedHours))
    const regularHours = round2(worked - overtimeHours)
    const shortfallHours = round2(Math.max(0, expectedHours - worked))
    const basePay = round2(regularHours * emp.hourly_rate)
    const overtimePay = round2(overtimeHours * emp.hourly_rate * settings.overtime_multiplier)
    const totalPay = round2(basePay + overtimePay)
    return {
      employeeId: emp.id,
      name: emp.name,
      hourlyRate: emp.hourly_rate,
      workedHours: worked,
      expectedHours,
      overtimeHours,
      regularHours,
      shortfallHours,
      basePay,
      overtimePay,
      totalPay,
      openShifts,
    }
  })
}
