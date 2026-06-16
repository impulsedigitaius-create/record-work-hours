'use client'
import Link from 'next/link'
import { useLang } from '@/components/lang-provider'
import { Logo } from '@/components/ui/logo'
import { LangToggle } from '@/components/ui/lang-toggle'

export default function LandingPage() {
  const { t } = useLang()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="absolute top-4 right-4">
        <LangToggle />
      </div>

      <div className="text-center mb-10 animate-fade-up">
        <div className="flex justify-center mb-4">
          <Logo size={140} />
        </div>
        <h1 className="font-display text-4xl sm:text-5xl text-espresso">{t.portalTitle}</h1>
        <p className="text-espresso/60 mt-2">{t.chooseSubtitle}</p>
      </div>

      <div className="w-full max-w-xs animate-fade-up flex flex-col items-center gap-4">
        {/* Clock In */}
        <Link href="/clock" className="block group w-full">
          <div className="bg-cream border border-latte shadow-card group-hover:shadow-card-hover rounded-2xl p-7 text-center transition-all group-hover:-translate-y-1">
            <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-camp-green-light to-camp-green-dark flex items-center justify-center shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-white" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="9" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 2" />
              </svg>
            </div>
            <h2 className="font-display text-2xl text-espresso">{t.clockTile}</h2>
            <p className="text-espresso/60 text-sm mt-1.5">{t.clockTileDesc}</p>
          </div>
        </Link>

        {/* Staff — texto pequeño sin recuadro */}
        <Link href="/admin/login" className="text-espresso/40 hover:text-espresso/70 text-sm transition-colors">
          {t.staffTile}
        </Link>
      </div>
    </div>
  )
}
