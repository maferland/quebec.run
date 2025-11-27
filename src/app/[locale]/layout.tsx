import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { ConsentBannerWrapper } from '@/components/consent-banner-wrapper'
import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Providers } from '../providers'
import { locales } from '@/i18n'

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

  // Validate locale in child layout where notFound() is allowed
  if (!locales.includes(locale as (typeof locales)[number])) {
    notFound()
  }

  // Providing all messages to the client
  const messages = await getMessages({ locale })

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Providers>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
        <ConsentBannerWrapper />
      </Providers>
    </NextIntlClientProvider>
  )
}
