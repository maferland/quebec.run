import { defaultLocale, locales } from '@/i18n'
import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales,
  defaultLocale,
})
