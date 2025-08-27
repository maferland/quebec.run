import type { Metadata } from 'next'
import { Montserrat, Inter } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
import '../globals.css'
import { Providers } from '../providers'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'metadata' })

  return {
    title: t('title'),
    description: t('description'),
  }
}

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  // Providing all messages to the client
  const messages = await getMessages({ locale })

  return (
    <html lang={locale}>
      <body
        className={`${montserrat.variable} ${inter.variable} font-body antialiased bg-surface-variant`}
      >
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
