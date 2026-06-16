'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useLang } from '@/components/lang-provider'
import { AppButton } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'

const TZ = 'America/New_York'

function useLiveClock() {
  const [time, setTime] = useState('')
  const [date, setDate] = useState('')

  useEffect(() => {
    function tick() {
      const now = new Date()
      setTime(now.toLocaleTimeString('en-US', { timeZone: TZ, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }))
      setDate(now.toLocaleDateString('en-US', { timeZone: TZ, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return { time, date }
}

export default function ClockPage() {
  const router = useRouter()
  const { t } = useLang()
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const [loading, setLoading] = useState(false)
  const { time, date } = useLiveClock()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!pin.trim() || loading) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: pin.trim() }),
      })
      if (!res.ok) {
        setError(t.invalidPin)
        setShake(true)
        setPin('')
        setTimeout(() => setShake(false), 400)
        return
      }
      router.push(`/confirm?code=${encodeURIComponent(pin.trim())}`)
    } catch {
      setError(t.invalidPin)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="absolute top-4 left-4">
        <Link
          href="/"
          className="text-sm font-semibold text-espresso/60 hover:text-camp-green transition-colors"
        >
          ← {t.back}
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-6"
      >
        <div className="flex justify-center mb-3">
          <Logo size={80} />
        </div>

        {/* Reloj en vivo */}
        {time && (
          <div className="mb-4">
            <p className="font-sans text-4xl sm:text-5xl font-bold text-espresso tabular-nums tracking-tight">
              {time}
            </p>
            <p className="text-espresso/50 text-sm mt-1">{date}</p>
          </div>
        )}

        <h1 className="font-display text-3xl sm:text-4xl text-espresso">{t.portalTitle}</h1>
        <p className="text-espresso/60 mt-1 text-sm">{t.portalSubtitle}</p>
      </motion.div>

      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="w-full max-w-sm bg-cream border border-latte shadow-card rounded-2xl p-6"
      >
        <div className={shake ? 'animate-shake' : ''}>
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder={t.pinPlaceholder}
            className="w-full text-center text-2xl tracking-[0.5em] font-semibold bg-sand/60 border border-latte rounded-xl py-4 outline-none focus:ring-2 focus:ring-camp-green/50 transition"
          />
        </div>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-terracotta text-sm text-center mt-3"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <AppButton type="submit" size="lg" loading={loading} className="mt-5">
          {t.continue}
        </AppButton>
      </motion.form>
    </div>
  )
}
