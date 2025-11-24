import { isSupportedLocale } from '@/i18n'
import { getRequestConfig } from 'next-intl/server'
import { notFound } from 'next/navigation'

export default getRequestConfig(async (params) => {
  // This typically corresponds to the `[locale]` segment
  const locale = await params.requestLocale

  if (!locale || !isSupportedLocale(locale)) {
    notFound()
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
