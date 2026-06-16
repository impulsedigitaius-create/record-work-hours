import type { Metadata } from 'next'
import { Playfair_Display, Inter, Orbitron } from 'next/font/google'
import './globals.css'
import { LangProvider } from '@/components/lang-provider'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-clock',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Payroll & Attendance',
  description: 'Employee time clock and payroll',
  icons: { icon: '/logo.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable} ${orbitron.variable}`}>
      <body className="app-bg min-h-screen">
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  )
}
