'use client'
import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { AppCard } from '@/components/ui/card'
import { EmployeeAvatar } from '@/components/ui/employee-avatar'
import type { PunchType } from '@/lib/types'

interface EmployeeRow {
  id: number
  last_name: string
  first_name: string
  name: string
  last_type: PunchType | null
  last_ts: string | null
}

type Status = 'working' | 'on_break' | 'clocked_out' | 'not_started'

function getStatus(lastType: PunchType | null): Status {
  if (lastType === 'IN' || lastType === 'BREAK_IN') return 'working'
  if (lastType === 'BREAK_OUT') return 'on_break'
  if (lastType === 'OUT') return 'clocked_out'
  return 'not_started'
}

const STATUS_CONFIG: Record<Status, { label: string; dot: string; badge: string; cardBorder: string }> = {
  working:     { label: 'Working',      dot: 'bg-olive',        badge: 'bg-olive/15 text-olive font-semibold',              cardBorder: 'border-l-4 border-l-olive' },
  on_break:    { label: 'On Break',     dot: 'bg-amber-400',    badge: 'bg-amber-100 text-amber-700 font-semibold',         cardBorder: 'border-l-4 border-l-amber-400' },
  clocked_out: { label: 'Clocked Out',  dot: 'bg-terracotta',   badge: 'bg-terracotta/15 text-terracotta font-semibold',    cardBorder: 'border-l-4 border-l-terracotta' },
  not_started: { label: 'Not Started',  dot: 'bg-espresso/20',  badge: 'bg-espresso/8 text-espresso/40 font-semibold',      cardBorder: 'border-l-4 border-l-latte' },
}

const SUMMARY_CARDS = [
  { status: 'working'     as Status, label: 'On Shift',     icon: '🟢', bg: 'bg-olive/10',        text: 'text-olive' },
  { status: 'on_break'    as Status, label: 'On Break',     icon: '🟡', bg: 'bg-amber-50',        text: 'text-amber-700' },
  { status: 'clocked_out' as Status, label: 'Clocked Out',  icon: '🔴', bg: 'bg-terracotta/10',   text: 'text-terracotta' },
  { status: 'not_started' as Status, label: 'Not Started',  icon: '⚪', bg: 'bg-sand',            text: 'text-espresso/50' },
]

function timeFromTs(ts: string | null): string {
  if (!ts) return ''
  return ts.slice(11, 16)
}

export default function TodayPage() {
  const [employees, setEmployees] = useState<EmployeeRow[]>([])
  const [date, setDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/today')
    if (res.ok) {
      const j = await res.json()
      setEmployees(j.employees)
      setDate(j.date)
      setLastRefresh(new Date())
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(load, 30_000) // auto-refresh every 30s
    return () => clearInterval(id)
  }, [load])

  const counts = employees.reduce(
    (acc, e) => { acc[getStatus(e.last_type)]++; return acc },
    { working: 0, on_break: 0, clocked_out: 0, not_started: 0 } as Record<Status, number>,
  )

  const grouped: Record<Status, EmployeeRow[]> = {
    working:     employees.filter((e) => getStatus(e.last_type) === 'working'),
    on_break:    employees.filter((e) => getStatus(e.last_type) === 'on_break'),
    clocked_out: employees.filter((e) => getStatus(e.last_type) === 'clocked_out'),
    not_started: employees.filter((e) => getStatus(e.last_type) === 'not_started'),
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-espresso">Today's Attendance</h1>
          {date && <p className="text-espresso/50 text-sm mt-0.5">{date}</p>}
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-xs text-espresso/40">
              Updated {lastRefresh.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
            </span>
          )}
          <button
            onClick={load}
            className="text-sm font-semibold text-clay hover:underline"
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-cream border border-latte rounded-2xl p-4 text-center shadow-card"
        >
          <p className="text-4xl font-bold text-espresso">{employees.length}</p>
          <p className="text-espresso/60 text-sm mt-1 font-semibold">Total Staff</p>
        </motion.div>

        {SUMMARY_CARDS.map((card, i) => (
          <motion.div
            key={card.status}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (i + 1) * 0.06 }}
            className={`${card.bg} border border-latte rounded-2xl p-4 text-center shadow-card`}
          >
            <p className={`text-4xl font-bold ${card.text}`}>{counts[card.status]}</p>
            <p className={`text-sm mt-1 font-semibold ${card.text}`}>{card.label}</p>
          </motion.div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <span className="w-8 h-8 border-4 border-clay/30 border-t-clay rounded-full animate-spin" />
        </div>
      ) : employees.length === 0 ? (
        <AppCard>
          <p className="text-espresso/50 text-center py-4">No active employees found.</p>
        </AppCard>
      ) : (
        <div className="space-y-6">
          {(['working', 'on_break', 'clocked_out', 'not_started'] as Status[]).map((status) => {
            const group = grouped[status]
            if (group.length === 0) return null
            const cfg = STATUS_CONFIG[status]
            return (
              <div key={status}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                  <h2 className="font-semibold text-espresso text-sm uppercase tracking-wide">
                    {cfg.label} — {group.length}
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {group.map((emp, i) => (
                    <motion.div
                      key={emp.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className={`bg-cream rounded-2xl shadow-card p-4 flex items-center gap-3 ${cfg.cardBorder}`}
                    >
                      <EmployeeAvatar name={emp.last_name} photoUrl={null} size={40} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-espresso truncate">
                          {emp.last_name}, {emp.first_name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.badge}`}>
                            {cfg.label}
                          </span>
                          {emp.last_ts && (
                            <span className="text-xs text-espresso/40 font-mono">
                              {timeFromTs(emp.last_ts)}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
