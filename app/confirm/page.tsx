'use client'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { useLang } from '@/components/lang-provider'
import { AppButton } from '@/components/ui/button'
import { EmployeeAvatar } from '@/components/ui/employee-avatar'
import type { PunchType } from '@/lib/types'

interface ValidateResult {
  employee: { id: number; name: string; photo_url: string | null }
  nextTypes: PunchType[]
}

const PUNCH_OPTIONS: Array<{
  type: PunchType
  label: string
  desc: string
  activeStyle: string
  icon: React.ReactNode
}> = [
  {
    type: 'IN',
    label: 'Clock In',
    desc: 'Start shift',
    activeStyle: 'bg-olive text-white ring-olive/50',
    icon: (
      /* Person walking in + sun — start of day */
      <svg viewBox="0 0 48 48" className="w-12 h-12" fill="currentColor">
        <circle cx="24" cy="10" r="5" />
        <path d="M14 22c0-5.5 4.5-8 10-8s10 2.5 10 8v2H14v-2z" />
        <path d="M20 26l-3 14h4l2-8 2 8h4l-3-14H20z" />
        <path d="M36 14l2-2m-2 2l2 2m-2-2h4m-4 0h-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <circle cx="38" cy="14" r="3" />
      </svg>
    ),
  },
  {
    type: 'BREAK_OUT',
    label: 'Break Out',
    desc: 'Start break',
    activeStyle: 'bg-amber-500 text-white ring-amber-400/50',
    icon: (
      /* Coffee cup with steam */
      <svg viewBox="0 0 48 48" className="w-12 h-12" fill="currentColor">
        <path d="M10 18h24v14a8 8 0 01-8 8H18a8 8 0 01-8-8V18z" />
        <path d="M34 22h3a5 5 0 010 10h-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M17 12c0-3 3-3 3-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M24 12c0-3 3-3 3-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <rect x="8" y="40" width="28" height="3" rx="1.5" />
      </svg>
    ),
  },
  {
    type: 'BREAK_IN',
    label: 'Break In',
    desc: 'Back to work',
    activeStyle: 'bg-sky-500 text-white ring-sky-400/50',
    icon: (
      /* Coffee cup with checkmark — break done */
      <svg viewBox="0 0 48 48" className="w-12 h-12" fill="currentColor">
        <path d="M10 18h24v14a8 8 0 01-8 8H18a8 8 0 01-8-8V18z" opacity="0.4" />
        <path d="M34 22h3a5 5 0 010 10h-3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
        <rect x="8" y="40" width="28" height="3" rx="1.5" opacity="0.4" />
        <circle cx="36" cy="12" r="9" />
        <path d="M31 12l3 3 6-6" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    type: 'OUT',
    label: 'Clock Out',
    desc: 'End shift',
    activeStyle: 'bg-terracotta text-white ring-terracotta/50',
    icon: (
      /* Person walking out + moon — end of day */
      <svg viewBox="0 0 48 48" className="w-12 h-12" fill="currentColor">
        <circle cx="24" cy="10" r="5" />
        <path d="M14 22c0-5.5 4.5-8 10-8s10 2.5 10 8v2H14v-2z" />
        <path d="M20 26l-3 14h4l2-8 2 8h4l-3-14H20z" />
        <path d="M37 10a7 7 0 11-7-7 5 5 0 007 7z" />
      </svg>
    ),
  },
]

const SUCCESS_COLOR: Record<PunchType, string> = {
  IN: 'bg-olive',
  BREAK_OUT: 'bg-amber-500',
  BREAK_IN: 'bg-sky-500',
  OUT: 'bg-terracotta',
}

const SUCCESS_MSG: Record<PunchType, (t: Record<string, string>) => string> = {
  IN:        (t) => t.clockedInAt,
  BREAK_OUT: (t) => t.clockedBreakOutAt,
  BREAK_IN:  (t) => t.clockedBreakInAt,
  OUT:       (t) => t.clockedOutAt,
}

function ConfirmInner() {
  const router = useRouter()
  const params = useSearchParams()
  const code = params.get('code') ?? ''
  const { t } = useLang()

  const [data, setData] = useState<ValidateResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState<PunchType | null>(null)
  const [doneType, setDoneType] = useState<PunchType | null>(null)
  const [doneTime, setDoneTime] = useState('')

  useEffect(() => {
    if (!code) { router.replace('/'); return }
    fetch('/api/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('invalid')
        setData(await res.json())
      })
      .catch(() => router.replace('/'))
      .finally(() => setLoading(false))
  }, [code, router])

  async function confirm(type: PunchType) {
    if (!data || submitting) return
    setSubmitting(type)
    try {
      const res = await fetch('/api/punch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, type }),
      })
      if (!res.ok) throw new Error('punch failed')
      const json = await res.json()
      setDoneType(json.type)
      setDoneTime(json.time)
    } catch {
      router.replace('/')
    } finally {
      setSubmitting(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="w-8 h-8 border-4 border-clay/30 border-t-clay rounded-full animate-spin" />
      </div>
    )
  }

  // Success screen
  if (doneType) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <motion.div
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 18 }}
          className={`w-24 h-24 rounded-full flex items-center justify-center shadow-lg text-white ${SUCCESS_COLOR[doneType]}`}
        >
          <svg viewBox="0 0 24 24" fill="none" className="w-12 h-12" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="font-display text-3xl text-espresso mt-6"
        >
          {data?.employee.name}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="text-espresso/70 mt-1"
        >
          {SUCCESS_MSG[doneType](t)}{' '}
          <span className="font-semibold">{doneTime}</span>
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="mt-8 w-full max-w-xs"
        >
          <AppButton size="lg" onClick={() => router.push('/')}>
            {t.done}
          </AppButton>
        </motion.div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        {/* Employee card */}
        <div className="bg-cream border border-latte shadow-card rounded-2xl p-6 text-center mb-5">
          <div className="flex justify-center mb-3">
            <EmployeeAvatar name={data.employee.name} photoUrl={data.employee.photo_url} size={64} />
          </div>
          <p className="text-espresso/60 text-sm">{t.welcome}</p>
          <h2 className="font-display text-2xl text-espresso">{data.employee.name}</h2>
        </div>

        {/* 4 buttons — all valid next types are active */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {PUNCH_OPTIONS.map((opt, i) => {
            const isActive = data.nextTypes.includes(opt.type)
            const isLoading = submitting === opt.type
            return (
              <motion.button
                key={opt.type}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={isActive ? () => confirm(opt.type) : undefined}
                disabled={!isActive || !!submitting}
                className={`
                  relative flex flex-col items-center gap-2.5 rounded-2xl p-5 font-semibold text-sm
                  ring-2 transition-all duration-150 select-none
                  ${isActive
                    ? `${opt.activeStyle} ring-[3px] shadow-lg cursor-pointer active:scale-[0.97]`
                    : 'bg-sand/50 text-espresso/25 ring-latte/60 cursor-not-allowed'
                  }
                `}
              >
                {isLoading ? (
                  <span className="w-8 h-8 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  opt.icon
                )}
                <div className="text-center leading-tight">
                  <p className="font-bold">{opt.label}</p>
                  <p className={`text-xs mt-0.5 ${isActive ? 'opacity-80' : 'opacity-40'}`}>{opt.desc}</p>
                </div>
                {isActive && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-espresso flex items-center justify-center shadow">
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} className="w-3 h-3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </span>
                )}
              </motion.button>
            )
          })}
        </div>

        <AppButton variant="ghost" className="w-full" onClick={() => router.push('/')}>
          {t.cancel}
        </AppButton>
      </motion.div>
    </div>
  )
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmInner />
    </Suspense>
  )
}
