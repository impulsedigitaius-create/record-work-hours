export type PunchType = 'IN' | 'BREAK_OUT' | 'BREAK_IN' | 'OUT'

export interface Employee {
  id: number
  last_name: string
  first_name: string
  name: string        // display: "First Last" — used on punch screen
  code: string
  phone: string | null
  email: string | null
  details: string | null
  hourly_rate: number
  photo_url: string | null
  active: number // 1 | 0
}

export interface Punch {
  id: number
  employee_id: number
  type: PunchType
  date: string // YYYY-MM-DD
  ts: string // YYYY-MM-DD HH:MM:SS
  synced_sheets: number
}

export interface Settings {
  weekly_hours: number
  working_days: number
  overtime_multiplier: number
}

export interface PayrollRow {
  employeeId: number
  name: string
  hourlyRate: number
  workedHours: number
  expectedHours: number
  overtimeHours: number
  regularHours: number
  shortfallHours: number
  basePay: number
  overtimePay: number
  totalPay: number
  openShifts: number
}
