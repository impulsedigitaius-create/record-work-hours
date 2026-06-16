'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useLang } from '@/components/lang-provider'
import { AppButton } from '@/components/ui/button'
import { AppCard } from '@/components/ui/card'
import type { PayrollRow } from '@/lib/types'

type Preset = 'today' | 'weekly' | 'biweekly' | 'custom'

const TZ = 'America/New_York'

function isoOffset(days: number): string {
  const d = new Date(Date.now() + days * 86_400_000)
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d)
}

function shiftDate(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d + days)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function periodDaysCount(f: string, t: string): number {
  return Math.max(1, Math.round((new Date(t).getTime() - new Date(f).getTime()) / 86_400_000) + 1)
}

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

function fmtShort(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function mondayOf(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const day = date.getDay() // 0=Sun … 6=Sat
  const daysBack = day === 0 ? 6 : day - 1
  date.setDate(date.getDate() - daysBack)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export default function PayrollPage() {
  const { t } = useLang()
  const [preset, setPreset] = useState<Preset>('today')
  const [from, setFrom] = useState(isoOffset(0))
  const [to, setTo]     = useState(isoOffset(0))
  const [rows, setRows] = useState<PayrollRow[] | null>(null)
  const [loading, setLoading] = useState(false)

  function applyPreset(p: Preset) {
    setPreset(p)
    const today  = isoOffset(0)
    const monday = mondayOf(today)
    if (p === 'today')    { setFrom(today);                    setTo(today)  }
    if (p === 'weekly')   { setFrom(monday);                   setTo(today)  }
    if (p === 'biweekly') { setFrom(shiftDate(monday, -7));    setTo(today)  }
  }

  const isDaily = preset === 'today'

  const calculate = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/payroll?from=${from}&to=${to}`)
    if (res.ok) setRows((await res.json()).rows)
    setLoading(false)
  }, [from, to])

  useEffect(() => { calculate() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const totals = useMemo(() => {
    if (!rows) return null
    return rows.reduce(
      (acc, r) => ({ worked: acc.worked + r.workedHours, total: acc.total + r.totalPay }),
      { worked: 0, total: 0 },
    )
  }, [rows])

  function shiftPeriod(dir: -1 | 1) {
    if (preset === 'today') {
      const next = shiftDate(from, dir)
      setFrom(next); setTo(next)
    } else if (preset === 'weekly') {
      const newFrom = shiftDate(from, dir * 7)
      setFrom(newFrom)
      setTo(shiftDate(newFrom, 6))
    } else if (preset === 'biweekly') {
      const newFrom = shiftDate(from, dir * 14)
      setFrom(newFrom)
      setTo(shiftDate(newFrom, 13))
    }
  }

  function exportPdf() {
    if (!rows?.length || !totals) return
    const periodLabel = isDaily ? fmtDate(from) : `${fmtShort(from)} — ${fmtShort(to)}`
    const totalHours  = totals.worked.toFixed(2)
    const generated   = new Date().toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })

    const rowsHtml = rows.map((r, i) => `
      <tr style="background:${i % 2 === 0 ? '#ffffff' : '#faf8f5'}">
        <td style="padding:11px 18px;font-size:13px;color:#2c1a0e;border-bottom:1px solid #ede5db;">
          ${r.name}${r.openShifts > 0 ? ' <span style="color:#b45309;font-size:11px;" title="Open shift — clock-out missing">⚠</span>' : ''}
        </td>
        <td style="padding:11px 18px;font-size:14px;font-weight:700;color:#2c1a0e;text-align:right;border-bottom:1px solid #ede5db;">
          ${r.workedHours.toFixed(2)}h
        </td>
      </tr>`).join('')

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Payroll — ${periodLabel}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Playfair+Display:wght@700&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Inter',system-ui,sans-serif;background:#fff;color:#2c1a0e;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .page{max-width:620px;margin:0 auto;padding:44px 36px}
    .header{display:flex;align-items:flex-start;justify-content:space-between;border-bottom:2px solid #e8ddd0;padding-bottom:22px;margin-bottom:28px}
    .brand{font-family:'Playfair Display',Georgia,serif;font-size:24px;color:#2c1a0e;line-height:1}
    .brand em{color:#a04a2f;font-style:normal}
    .brand sub{display:block;font-family:'Inter',sans-serif;font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#8a7060;margin-top:5px}
    .meta{text-align:right;font-size:11px;color:#8a7060;line-height:1.6}
    .period{font-family:'Playfair Display',Georgia,serif;font-size:19px;color:#2c1a0e;margin-bottom:22px}
    table{width:100%;border-collapse:collapse;overflow:hidden;margin-bottom:24px;box-shadow:0 1px 4px rgba(44,26,14,.08)}
    thead tr{background:#3b2f23}
    thead th{padding:12px 18px;font-size:10.5px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:#fff}
    thead th:last-child{text-align:right}
    tbody tr:last-child td{border-bottom:none!important}
    .totals{background:#3b2f23;border-radius:12px;padding:18px 22px;display:flex;align-items:center;justify-content:space-between}
    .totals-label{font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:rgba(255,248,240,.55)}
    .totals-sub{font-size:11px;color:rgba(255,248,240,.4);margin-top:3px}
    .totals-value{font-size:30px;font-weight:700;color:#fff8f0}
    .footer{margin-top:32px;padding-top:14px;border-top:1px solid #e8ddd0;font-size:10px;color:#b09880;text-align:center}
    @media print{.page{padding:20px}}
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="brand">Lox Life <em>Camps</em><sub>Payroll Report</sub></div>
      <div class="meta">
        <div style="font-weight:600;color:#5a3e2b;margin-bottom:2px">Time Clock &amp; Payroll</div>
        <div>Generated ${generated}</div>
      </div>
    </div>
    <div class="period">${periodLabel}</div>
    <table>
      <thead><tr><th style="text-align:left">Employee</th><th>Hours Worked</th></tr></thead>
      <tbody>${rowsHtml}</tbody>
    </table>
    <div class="totals">
      <div>
        <div class="totals-label">${isDaily ? 'Day Total' : 'Period Total'}</div>
        <div class="totals-sub">${rows.length} employee${rows.length !== 1 ? 's' : ''}</div>
      </div>
      <div class="totals-value">${totalHours}h</div>
    </div>
    <div class="footer">Lox Life Camps &nbsp;·&nbsp; ${new Date().getFullYear()}</div>
  </div>
  <script>window.onload=()=>{window.print()}<\/script>
</body>
</html>`

    const win = window.open('', '_blank', 'width=720,height=650')
    if (!win) return
    win.document.write(html)
    win.document.close()
  }

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-display text-3xl text-espresso">{t.payroll}</h1>
        {rows && rows.length > 0 && (
          <button onClick={exportPdf} className="inline-flex items-center gap-1.5 text-sm font-semibold text-clay hover:text-espresso transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0-3-3m3 3 3-3M3 17a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-2.5M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2m6 0H8m8 0a2 2 0 0 1 2 2v1"/></svg>
            Export PDF
          </button>
        )}
      </div>

      {/* ── Period controls ── */}
      <AppCard className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Preset pills */}
          <div className="flex gap-1 bg-sand/60 rounded-xl p-1">
            {(['today', 'weekly', 'biweekly', 'custom'] as Preset[]).map((p) => (
              <button
                key={p}
                onClick={() => applyPreset(p)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  preset === p ? 'bg-clay text-white shadow-sm' : 'text-espresso/60 hover:text-espresso'
                }`}
              >
                {p === 'today' ? (t.today ?? 'Today') : t[p]}
              </button>
            ))}
          </div>

          {/* ← → navigation */}
          {preset !== 'custom' && (
            <div className="flex items-center gap-1">
              <button onClick={() => shiftPeriod(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-sand/60 border border-latte text-espresso/70 hover:bg-latte transition font-bold">‹</button>
              <button onClick={() => shiftPeriod(1)}  className="w-8 h-8 flex items-center justify-center rounded-lg bg-sand/60 border border-latte text-espresso/70 hover:bg-latte transition font-bold">›</button>
            </div>
          )}

          {/* Date inputs (show for custom, or show single date for today) */}
          {preset === 'today' ? (
            <input type="date" value={from}
              onChange={(e) => { setFrom(e.target.value); setTo(e.target.value) }}
              className="bg-sand/60 border border-latte rounded-xl py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-clay/40"
            />
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <input type="date" value={from}
                onChange={(e) => { setPreset('custom'); setFrom(e.target.value) }}
                className="bg-sand/60 border border-latte rounded-xl py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-clay/40"
              />
              <span className="text-espresso/40 font-semibold">→</span>
              <input type="date" value={to}
                onChange={(e) => { setPreset('custom'); setTo(e.target.value) }}
                className="bg-sand/60 border border-latte rounded-xl py-2 px-3 text-sm outline-none focus:ring-2 focus:ring-clay/40"
              />
            </div>
          )}

          <AppButton onClick={calculate} loading={loading} className="ml-auto">
            {t.calculate}
          </AppButton>
        </div>
      </AppCard>

      {rows && rows.length === 0 && (
        <AppCard><p className="text-espresso/60 text-center py-2">{t.noData}</p></AppCard>
      )}

      {rows && rows.length > 0 && totals && (
        <>
          {/* ── Period label ── */}
          <p className="text-espresso/50 text-sm font-semibold mb-3 px-1">
            {isDaily ? fmtDate(from) : `${fmtShort(from)} → ${fmtShort(to)}`}
          </p>

          {/* ── Employee table ── */}
          <AppCard className="p-0 overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-latte bg-sand/40">
                    <th className="px-5 py-3 text-left font-semibold text-espresso/60">Employee</th>
                    <th className="px-5 py-3 text-right font-semibold text-espresso/60">Hours Worked</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <motion.tr
                      key={r.employeeId}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-latte/50 last:border-0 hover:bg-sand/30 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <span className="font-semibold text-espresso">{r.name}</span>
                        {r.openShifts > 0 && (
                          <span className="ml-1 text-xs text-espresso/40" title="Open shift — clock-out missing">⚠</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-espresso text-base">{r.workedHours.toFixed(2)}h</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AppCard>

          {/* ── Grand total ── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-espresso rounded-2xl p-5 flex items-center justify-between shadow-lg"
          >
            <p className="text-cream/60 text-sm font-semibold uppercase tracking-wide">
              {isDaily ? "Total del Día" : "Total del Período"} · {rows.length} empleados
            </p>
            <p className="text-3xl font-bold text-cream">{totals.worked.toFixed(2)}h</p>
          </motion.div>
        </>
      )}
    </div>
  )
}
