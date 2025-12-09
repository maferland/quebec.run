import type { Metadata } from 'next'
import { Inter, Montserrat } from 'next/font/google'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

const montserrat = Montserrat({
  variable: '--font-heading',
  subsets: ['latin'],
  display: 'swap',
})

const inter = Inter({
  variable: '--font-body',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'quebec.run',
  description: 'Running Community in Quebec City',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html suppressHydrationWarning>
      <body
        className={`${montserrat.variable} ${inter.variable} font-body antialiased bg-surface-variant`}
      >
        {children}
        <SpeedInsights />
      </body>
    </html>
  )
}
