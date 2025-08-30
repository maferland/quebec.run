export const locales = ['en', 'fr'] as const
export type Locales = (typeof locales)[number]
export const isSupportedLocale = (locale?: string): locale is Locales => {
  return Boolean(locale && locale.trim()) && locales.includes(locale as Locales)
}
export const defaultLocale = 'fr' as const
