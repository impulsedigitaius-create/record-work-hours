'use client'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useLang } from '@/components/lang-provider'
import { AppButton } from '@/components/ui/button'
import { AppCard } from '@/components/ui/card'
import type { Settings } from '@/lib/types'

export default function SettingsPage() {
  const { t } = useLang()
  const [form, setForm] = useState<Settings>({
    weekly_hours: 40,
    working_days: 5,
    overtime_multiplier: 1.5, // kept in DB/API but not shown in UI
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((j) => j.settings && setForm(j.settings))
      .finally(() => setLoading(false))
  }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
  }

  if (loading) return <p className="text-espresso/50">…</p>

  const expectedDaily =
    form.working_days > 0 ? (form.weekly_hours / form.working_days).toFixed(2) : '—'

  return (
    <div>
      <h1 className="font-display text-3xl text-espresso mb-6">{t.settings}</h1>
      <AppCard className="max-w-lg">
        <form onSubmit={save} className="space-y-5">
          <NumField
            label={t.weeklyHours}
            value={form.weekly_hours}
            step="0.5"
            onChange={(v) => setForm({ ...form, weekly_hours: v })}
          />
          <NumField
            label={t.workingDays}
            value={form.working_days}
            step="1"
            min={1}
            max={7}
            onChange={(v) => setForm({ ...form, working_days: v })}
          />

          <div className="text-sm text-espresso/60 bg-sand/60 rounded-xl px-4 py-3">
            {t.expectedHours}/day: <span className="font-semibold text-espresso">{expectedDaily}h</span>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <AppButton type="submit" loading={saving}>
              {saving ? t.saving : t.save}
            </AppButton>
            <AnimatePresence>
              {saved && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-olive font-semibold text-sm"
                >
                  ✓ {t.settingsSaved}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </form>
      </AppCard>
    </div>
  )
}

function NumField({
  label,
  value,
  step,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  step: string
  min?: number
  max?: number
  onChange: (v: number) => void
}) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-espresso/70 mb-1">{label}</span>
      <input
        type="number"
        step={step}
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full bg-sand/60 border border-latte rounded-xl py-2.5 px-4 outline-none focus:ring-2 focus:ring-clay/50 transition"
      />
    </label>
  )
}
