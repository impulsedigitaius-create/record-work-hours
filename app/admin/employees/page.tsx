'use client'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLang } from '@/components/lang-provider'
import { AppButton } from '@/components/ui/button'
import { AppCard } from '@/components/ui/card'
import { EmployeeAvatar } from '@/components/ui/employee-avatar'
import type { Employee, Punch, PunchType } from '@/lib/types'

interface FormState {
  id?: number
  last_name: string
  first_name: string
  code: string
  phone: string
  email: string
  details: string
  hourly_rate: string
}

function generatePin(existing: string[]): string {
  let pin: string
  let attempts = 0
  do {
    pin = String(Math.floor(1000 + Math.random() * 9000))
    attempts++
  } while (existing.includes(pin) && attempts < 100)
  return pin
}

const empty: FormState = { last_name: '', first_name: '', code: '', phone: '', email: '', details: '', hourly_rate: '' }

export default function EmployeesPage() {
  const { t } = useLang()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<FormState | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [confirmDeactivate, setConfirmDeactivate] = useState<Employee | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Employee | null>(null)
  const [manualEntry, setManualEntry] = useState<Employee | null>(null)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/employees')
    if (res.ok) {
      const json = await res.json()
      setEmployees(json.employees)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  function openNew() {
    setError('')
    const usedPins = employees.map((e) => e.code)
    setModal({ ...empty, code: generatePin(usedPins) })
  }

  function regeneratePin() {
    if (!modal) return
    const usedPins = employees.map((e) => e.code).filter((c) => c !== modal.code)
    setModal({ ...modal, code: generatePin(usedPins) })
  }
  function openEdit(e: Employee) {
    setError('')
    setModal({
      id: e.id,
      last_name: e.last_name,
      first_name: e.first_name,
      code: e.code,
      phone: e.phone ?? '',
      email: e.email ?? '',
      details: e.details ?? '',
      hourly_rate: String(e.hourly_rate),
    })
  }

  async function save() {
    if (!modal) return
    if (!modal.last_name.trim()) { setError(t.lastName + ' is required'); return }
    if (!modal.first_name.trim()) { setError(t.firstName + ' is required'); return }
    if (!modal.id && !modal.phone.trim()) { setError(t.phone + ' is required'); return }
    setSaving(true)
    setError('')
    const payload = {
      last_name: modal.last_name,
      first_name: modal.first_name,
      code: modal.code,
      phone: modal.phone,
      email: modal.email || null,
      details: modal.details || null,
      hourly_rate: modal.hourly_rate || '0',
    }
    const res = modal.id
      ? await fetch(`/api/employees/${modal.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      : await fetch('/api/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
    setSaving(false)
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      setError(j.error ?? 'Error')
      return
    }
    setModal(null)
    load()
  }

  async function doToggleActive(e: Employee) {
    if (e.active) {
      await fetch(`/api/employees/${e.id}`, { method: 'DELETE' })
    } else {
      await fetch(`/api/employees/${e.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: 1 }),
      })
    }
    load()
  }

  function handleDeactivateClick(e: Employee) {
    if (e.active) {
      setConfirmDeactivate(e)
    } else {
      doToggleActive(e)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl text-espresso">{t.employees}</h1>
        <AppButton onClick={openNew}>+ {t.newEmployee}</AppButton>
      </div>

      {loading ? (
        <p className="text-espresso/50">…</p>
      ) : employees.length === 0 ? (
        <AppCard>
          <p className="text-espresso/60">{t.noEmployees}</p>
        </AppCard>
      ) : (
        <AppCard className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-espresso/50 border-b border-latte">
                  <th className="px-5 py-3 font-semibold">{t.lastName}</th>
                  <th className="px-5 py-3 font-semibold">{t.firstName}</th>
                  <th className="px-5 py-3 font-semibold">{t.code}</th>
                  <th className="px-5 py-3 font-semibold">{t.status}</th>
                  <th className="px-5 py-3 font-semibold text-right">{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((e) => (
                  <tr key={e.id} className="border-b border-latte/60 last:border-0">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <EmployeeAvatar name={e.last_name} photoUrl={e.photo_url} size={32} />
                        <span className="font-semibold text-espresso">{e.last_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-espresso">{e.first_name}</td>
                    <td className="px-5 py-3 font-mono text-espresso/70">{e.code}</td>
                    <td className="px-5 py-3">
                      <span
                        className={
                          e.active
                            ? 'text-olive font-semibold'
                            : 'text-espresso/40 font-semibold'
                        }
                      >
                        {e.active ? t.active : t.inactive}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <RowMenu
                        onManual={() => setManualEntry(e)}
                        onEdit={() => openEdit(e)}
                        onDeactivate={() => handleDeactivateClick(e)}
                        onDelete={() => setConfirmDelete(e)}
                        isActive={e.active === 1}
                        deactivateLabel={e.active === 1 ? t.deactivate : t.activate}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AppCard>
      )}

      <AnimatePresence>
        {modal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-espresso/30 backdrop-blur-sm flex items-center justify-center px-4 z-30"
            onClick={() => setModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              className="w-full max-w-md bg-cream rounded-2xl shadow-card-hover p-6"
              onClick={(ev) => ev.stopPropagation()}
            >
              <h2 className="font-display text-2xl text-espresso mb-4">
                {modal.id ? t.editEmployee : t.newEmployee}
              </h2>
              <div className="space-y-4">
                <Field label={`${t.lastName} *`}>
                  <input
                    className="field"
                    value={modal.last_name}
                    onChange={(e) => setModal({ ...modal, last_name: e.target.value })}
                    autoFocus
                  />
                </Field>
                <Field label={`${t.firstName} *`}>
                  <input
                    className="field"
                    value={modal.first_name}
                    onChange={(e) => setModal({ ...modal, first_name: e.target.value })}
                  />
                </Field>
                <Field label={t.code}>
                  <div className="flex gap-2">
                    <input
                      className="field font-mono text-center tracking-widest text-xl flex-1"
                      value={modal.code}
                      readOnly
                    />
                    {!modal.id && (
                      <button
                        type="button"
                        onClick={regeneratePin}
                        className="px-3 py-2 rounded-xl border border-latte bg-sand/60 text-espresso/60 hover:text-espresso hover:bg-latte transition text-sm font-semibold whitespace-nowrap"
                        title="Generate new PIN"
                      >
                        ↻ New
                      </button>
                    )}
                  </div>
                </Field>
                <Field label={`${t.phone} *`}>
                  <input
                    type="tel"
                    className="field"
                    value={modal.phone}
                    onChange={(e) => setModal({ ...modal, phone: e.target.value })}
                    placeholder="(555) 000-0000"
                  />
                </Field>
                <Field label={t.email}>
                  <input
                    type="email"
                    className="field"
                    value={modal.email}
                    onChange={(e) => setModal({ ...modal, email: e.target.value })}
                    placeholder="optional"
                  />
                </Field>
                <Field label={t.details}>
                  <textarea
                    className="field"
                    rows={2}
                    value={modal.details}
                    onChange={(e) => setModal({ ...modal, details: e.target.value })}
                    placeholder="optional"
                  />
                </Field>
              </div>
              {error && <p className="text-terracotta text-sm mt-3">{error}</p>}
              <div className="flex gap-3 mt-6">
                <AppButton onClick={save} loading={saving} className="flex-1">
                  {saving ? t.saving : t.save}
                </AppButton>
                <AppButton variant="ghost" onClick={() => setModal(null)}>
                  {t.cancel}
                </AppButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmDeactivate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-espresso/30 backdrop-blur-sm flex items-center justify-center px-4 z-30"
            onClick={() => setConfirmDeactivate(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              className="w-full max-w-sm bg-cream rounded-2xl shadow-card-hover p-6 text-center"
              onClick={(ev) => ev.stopPropagation()}
            >
              <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-terracotta/15 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-terracotta" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <h2 className="font-display text-xl text-espresso mb-2">{t.deactivate} {confirmDeactivate.last_name}, {confirmDeactivate.first_name}?</h2>
              <p className="text-espresso/60 text-sm mb-6">{t.deactivateConfirmNote}</p>
              <div className="flex gap-3">
                <AppButton
                  variant="danger"
                  className="flex-1"
                  onClick={() => {
                    doToggleActive(confirmDeactivate)
                    setConfirmDeactivate(null)
                  }}
                >
                  {t.deactivate}
                </AppButton>
                <AppButton variant="ghost" onClick={() => setConfirmDeactivate(null)}>
                  {t.cancel}
                </AppButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-espresso/30 backdrop-blur-sm flex items-center justify-center px-4 z-30"
            onClick={() => setConfirmDelete(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              className="w-full max-w-sm bg-cream rounded-2xl shadow-card-hover p-6 text-center"
              onClick={(ev) => ev.stopPropagation()}
            >
              <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-terracotta/15 flex items-center justify-center">
                <span className="text-2xl">🗑</span>
              </div>
              <h2 className="font-display text-xl text-espresso mb-1">Delete permanently?</h2>
              <p className="text-espresso font-semibold mb-1">{confirmDelete.last_name}, {confirmDelete.first_name}</p>
              <p className="text-espresso/60 text-sm mb-6">This will delete the employee and <strong>all their punch history</strong> from the database. This cannot be undone.</p>
              <div className="flex gap-3">
                <AppButton
                  variant="danger"
                  className="flex-1"
                  onClick={async () => {
                    await fetch(`/api/employees/${confirmDelete.id}?permanent=true`, { method: 'DELETE' })
                    setConfirmDelete(null)
                    load()
                  }}
                >
                  🗑 Delete Forever
                </AppButton>
                <AppButton variant="ghost" onClick={() => setConfirmDelete(null)}>
                  {t.cancel}
                </AppButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {manualEntry && (
          <ManualEntryModal employee={manualEntry} onClose={() => setManualEntry(null)} />
        )}
      </AnimatePresence>

      <style jsx global>{`
        .field {
          width: 100%;
          background: rgba(245, 239, 230, 0.6);
          border: 1px solid #ece2d0;
          border-radius: 0.75rem;
          padding: 0.625rem 0.875rem;
          outline: none;
          transition: box-shadow 0.15s;
        }
        .field:focus {
          box-shadow: 0 0 0 2px rgba(192, 133, 82, 0.5);
        }
      `}</style>
    </div>
  )
}

function RowMenu({
  onManual, onEdit, onDeactivate, onDelete, isActive, deactivateLabel,
}: {
  onManual: () => void
  onEdit: () => void
  onDeactivate: () => void
  onDelete: () => void
  isActive: boolean
  deactivateLabel: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function item(label: string, onClick: () => void, danger = false) {
    return (
      <button
        onClick={() => { onClick(); setOpen(false) }}
        className={`w-full text-left px-4 py-2 text-sm font-semibold hover:bg-sand/60 transition-colors ${
          danger ? 'text-terracotta' : 'text-espresso'
        }`}
      >
        {label}
      </button>
    )
  }

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-sand/60 text-espresso/50 hover:text-espresso transition font-bold text-lg"
      >
        ⋮
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-20 w-44 bg-cream border border-latte rounded-xl shadow-card-hover py-1 overflow-hidden">
          {item('⏱ Manual Entry', onManual)}
          {item('✏️ Edit', onEdit)}
          {item(isActive ? `⛔ ${deactivateLabel}` : `✅ ${deactivateLabel}`, onDeactivate)}
          <div className="border-t border-latte/60 my-1" />
          {item('🗑 Delete Permanently', onDelete, true)}
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-espresso/70 mb-1">{label}</span>
      {children}
    </label>
  )
}

const PUNCH_LABELS: Record<PunchType, string> = {
  IN: 'Clock In',
  BREAK_OUT: 'Break Out',
  BREAK_IN: 'Break In',
  OUT: 'Clock Out',
}
const PUNCH_COLORS: Record<PunchType, string> = {
  IN: 'bg-olive/15 text-olive',
  BREAK_OUT: 'bg-amber-100 text-amber-700',
  BREAK_IN: 'bg-sky-100 text-sky-700',
  OUT: 'bg-terracotta/15 text-terracotta',
}

function todayLocal(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date())
}

function ManualEntryModal({ employee, onClose }: { employee: Employee; onClose: () => void }) {
  const [date, setDate] = useState(todayLocal())
  const [type, setType] = useState<PunchType>('IN')
  const [time, setTime] = useState('')
  const [punches, setPunches] = useState<Punch[]>([])
  const [loadingPunches, setLoadingPunches] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function fetchPunches(d: string) {
    setLoadingPunches(true)
    const res = await fetch(`/api/admin/punches?employee_id=${employee.id}&date=${d}`)
    if (res.ok) {
      const j = await res.json()
      setPunches(j.punches)
      // auto-select first available type
      const done = new Set<PunchType>(j.punches.map((p: Punch) => p.type))
      const available = (Object.keys(PUNCH_LABELS) as PunchType[]).filter((k) => !done.has(k))
      if (available.length > 0) setType(available[0])
    }
    setLoadingPunches(false)
  }

  useEffect(() => { fetchPunches(date) }, [date])

  async function addPunch() {
    if (!time) { setError('Enter a time'); return }
    setSaving(true)
    setError('')
    const res = await fetch('/api/admin/punches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employee_id: employee.id, date, time, type }),
    })
    setSaving(false)
    if (!res.ok) { setError('Failed to save'); return }
    setTime('')
    fetchPunches(date)
  }

  async function removePunch(id: number) {
    await fetch(`/api/admin/punches/${id}`, { method: 'DELETE' })
    fetchPunches(date)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-espresso/30 backdrop-blur-sm flex items-center justify-center px-4 z-30"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        className="w-full max-w-sm bg-cream rounded-2xl shadow-card-hover p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-display text-lg text-espresso leading-tight">Manual Entry</h2>
            <p className="text-espresso/50 text-xs">{employee.last_name}, {employee.first_name}</p>
          </div>
          <button onClick={onClose} className="text-espresso/40 hover:text-espresso text-xl leading-none">×</button>
        </div>

        {/* Date + existing punches in one row */}
        <div className="flex items-center gap-2 mb-3">
          <input
            type="date"
            className="field text-sm flex-1"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {/* Existing punches — compact */}
        {loadingPunches ? (
          <p className="text-espresso/40 text-xs mb-3">Loading…</p>
        ) : punches.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {punches.map((p) => (
              <div key={p.id} className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${PUNCH_COLORS[p.type]}`}>
                <span>{PUNCH_LABELS[p.type]}</span>
                <span className="font-mono">{p.ts.slice(11, 16)}</span>
                <button
                  onClick={() => removePunch(p.id)}
                  className="ml-0.5 opacity-50 hover:opacity-100 leading-none"
                  title="Delete"
                >×</button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-espresso/30 text-xs italic mb-3">No punches this day</p>
        )}

        {/* Divider */}
        <div className="border-t border-latte mb-3" />

        {/* Type selector — only available (not yet recorded) types */}
        {(() => {
          const done = new Set(punches.map((p) => p.type))
          const available = (Object.keys(PUNCH_LABELS) as PunchType[]).filter((k) => !done.has(k))
          if (available.length === 0) return (
            <p className="text-espresso/40 text-xs italic mb-3 text-center">All punches recorded for this day</p>
          )
          return (
            <div className="grid grid-cols-2 gap-1.5 mb-3">
              {available.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setType(k)}
                  className={`rounded-lg px-2 py-1.5 text-xs font-semibold border transition ${
                    type === k
                      ? 'border-clay bg-clay text-white shadow-sm'
                      : 'border-latte bg-sand/60 text-espresso/70 hover:bg-latte'
                  }`}
                >
                  {PUNCH_LABELS[k]}
                </button>
              ))}
            </div>
          )
        })()}

        {/* Time input + save — only when there are available types */}
        {punches.length < 4 && (
          <>
            <input
              type="time"
              className="field mb-3 text-xl font-bold text-center tracking-wide"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
            {error && <p className="text-terracotta text-xs mb-2">{error}</p>}
            <button
              onClick={addPunch}
              disabled={saving || !time}
              className={`w-full py-2.5 rounded-xl font-bold text-sm transition shadow-sm ${
                !time
                  ? 'bg-latte text-espresso/40 cursor-not-allowed'
                  : 'bg-clay text-white hover:bg-clay/90 active:scale-[0.98]'
              }`}
            >
              {saving ? 'Saving…' : `✓ Save ${PUNCH_LABELS[type]}`}
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}
