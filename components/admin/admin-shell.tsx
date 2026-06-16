'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import clsx from 'clsx'
import { useLang } from '@/components/lang-provider'
import { LangToggle } from '@/components/ui/lang-toggle'
import { Logo } from '@/components/ui/logo'

const tabs = [
  { href: '/admin/today',     key: 'today'     as const },
  { href: '/admin/employees', key: 'employees' as const },
  { href: '/admin/payroll',   key: 'payroll'   as const },
  { href: '/admin/settings',  key: 'settings'  as const },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useLang()

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 bg-cream/85 backdrop-blur-md border-b border-latte">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/admin/employees" className="flex items-center gap-2.5">
              <Logo size={36} />
              <span className="font-display text-2xl text-espresso">
                Payroll<span className="text-clay">.</span>
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <LangToggle />
              <Link
                href="/"
                className="text-sm font-semibold text-espresso/60 hover:text-camp-green transition-colors"
              >
                ← Home
              </Link>
              <button
                onClick={logout}
                className="text-sm font-semibold text-espresso/60 hover:text-terracotta transition-colors"
              >
                {t.logout}
              </button>
            </div>
          </div>
          <nav className="flex gap-1 -mb-px">
            {tabs.map((tab) => {
              const activeTab = pathname.startsWith(tab.href)
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={clsx(
                    'px-4 py-3 text-sm font-semibold border-b-2 transition-colors',
                    activeTab
                      ? 'border-clay text-espresso'
                      : 'border-transparent text-espresso/50 hover:text-espresso',
                  )}
                >
                  {t[tab.key]}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
