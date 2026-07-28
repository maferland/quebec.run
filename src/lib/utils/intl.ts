export const TORONTO_TIME_ZONE = 'America/Toronto'

export type SupportedLocale = 'fr' | 'en'

export function intlLocale(locale: string): string {
  return locale === 'fr' ? 'fr-CA' : 'en-CA'
}

// Dates always describe a Quebec City event, so they are formatted in its zone
// rather than the reader's.
export function formatEventDate(
  value: string | Date,
  locale: string,
  options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }
): string {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: TORONTO_TIME_ZONE,
    ...options,
  }).format(date)
}

// Strips diacritics so a search for "panthere" still finds "La Panthère".
export function foldAccents(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

export function foldedIncludes(
  haystack: string | null | undefined,
  foldedNeedle: string
): boolean {
  if (!haystack) return false
  return foldAccents(haystack).includes(foldedNeedle)
}
