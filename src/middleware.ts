import { defaultLocale, locales } from '@/i18n'
import createMiddleware from 'next-intl/middleware'

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
  localeCookie: false,
})

export const config = {
  matcher: '/((?!api|trpc|_next|_vercel|opengraph-image|.*\\..*).*)',
}
