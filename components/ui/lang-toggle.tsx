'use client'
import { useLang } from '@/components/lang-provider'

export function LangToggle() {
  const { lang, toggle } = useLang()
  return (
    <button
      onClick={toggle}
      className="text-xs font-bold tracking-wide text-espresso/60 hover:text-espresso transition-colors border border-latte rounded-lg px-2.5 py-1"
      aria-label="Toggle language"
    >
      {lang === 'en' ? 'EN · ES' : 'ES · EN'}
    </button>
  )
}
