'use client'
import { usePathname } from 'next/navigation'
import { AdminShell } from '@/components/admin/admin-shell'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // La pantalla de login no usa el shell (header/tabs).
  if (pathname.startsWith('/admin/login')) return <>{children}</>
  return <AdminShell>{children}</AdminShell>
}
