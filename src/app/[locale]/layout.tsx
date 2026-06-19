import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { ConsentBannerWrapper } from '@/components/consent-banner-wrapper'
import type { Metadata } from 'next'
import {
  Inter,
  Montserrat,
  Space_Grotesk,
  Hanken_Grotesk,
  Space_Mono,
} from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Providers } from '../providers'
import { locales } from '@/i18n'
import { buildPageMetadata, SITE_URL, type Locale } from '@/lib/seo/metadata'
import '../globals.css'

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

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  display: 'swap',
})

const hankenGrotesk = Hanken_Grotesk({
  variable: '--font-hanken-grotesk',
  subsets: ['latin'],
  display: 'swap',
})

const spaceMono = Space_Mono({
  variable: '--font-space-mono',
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
})

export const dynamicParams = false

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'metadata.home' })

  return {
    metadataBase: new URL(SITE_URL),
    ...buildPageMetadata({
      locale: locale as Locale,
      path: '',
      title: t('title'),
      description: t('description'),
    }),
  }
}

type Props = {
  children: React.ReactNode
  modal: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function LocaleLayout({ children, modal, params }: Props) {
  const { locale } = await params

  // Validate locale in child layout where notFound() is allowed
  if (!locales.includes(locale as (typeof locales)[number])) {
    notFound()
  }

  // Providing all messages to the client
  const messages = await getMessages({ locale })

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${montserrat.variable} ${inter.variable} ${spaceGrotesk.variable} ${hankenGrotesk.variable} ${spaceMono.variable} font-body antialiased bg-surface-variant overflow-x-hidden`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <ConsentBannerWrapper />
            {/* Modal overlay slot — rendered by @modal parallel route */}
            <div className="fixed inset-0 z-[1300] pointer-events-none">
              {modal}
            </div>
          </Providers>
        </NextIntlClientProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
