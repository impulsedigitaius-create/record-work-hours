'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { dict, DEFAULT_LANG, type Lang, type Dict } from '@/lib/i18n'

interface LangContextValue {
  lang: Lang
  setLang: (l: Lang) => void
  toggle: () => void
  t: Dict
}

const LangContext = createContext<LangContextValue | null>(null)
const STORAGE_KEY = 'app-lang'

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'es' || saved === 'en') setLangState(saved)
  }, [])

  const setLang = (l: Lang) => {
    setLangState(l)
    localStorage.setItem(STORAGE_KEY, l)
  }
  const toggle = () => setLang(lang === 'en' ? 'es' : 'en')

  return (
    <LangContext.Provider value={{ lang, setLang, toggle, t: dict[lang] }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used within <LangProvider>')
  return ctx
}
