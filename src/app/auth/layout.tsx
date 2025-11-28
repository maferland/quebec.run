import { defaultLocale } from '@/i18n'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getLocale } from 'next-intl/server'

type Props = {
  children: React.ReactNode
}

export default async function AuthLayout({ children }: Props) {
  // Get locale from middleware cookie/header, fallback to default
  const locale = (await getLocale()) || defaultLocale

  // Get messages for the detected locale
  const messages = await getMessages({ locale })

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}
