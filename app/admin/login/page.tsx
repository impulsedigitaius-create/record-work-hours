'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useLang } from '@/components/lang-provider'
import { AppButton } from '@/components/ui/button'
import { LangToggle } from '@/components/ui/lang-toggle'
import { Logo } from '@/components/ui/logo'

export default function AdminLoginPage() {
  const router = useRouter()
  const { t } = useLang()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        setError(t.wrongPassword)
        setShake(true)
        setPassword('')
        setTimeout(() => setShake(false), 400)
        return
      }
      router.push('/admin/today')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="absolute top-4 right-4">
        <LangToggle />
      </div>
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-8"
      >
        <div className="flex justify-center mb-4">
          <Logo size={100} />
        </div>
        <h1 className="font-display text-4xl text-espresso">
          {t.admin}
          <span className="text-clay">.</span>
        </h1>
      </motion.div>

      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="w-full max-w-sm bg-cream border border-latte shadow-card rounded-2xl p-6"
      >
        <label className="block text-sm font-semibold text-espresso/70 mb-2">{t.password}</label>
        <div className={shake ? 'animate-shake' : ''}>
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-sand/60 border border-latte rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-clay/50 transition"
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
          {t.login}
        </AppButton>
      </motion.form>
    </div>
  )
}
