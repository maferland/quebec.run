import { describe, expect, it } from 'vitest'
import {
  foldAccents,
  foldedIncludes,
  formatEventDate,
  intlLocale,
} from './intl'

describe('intlLocale', () => {
  it.each([
    { locale: 'fr', expected: 'fr-CA' },
    { locale: 'en', expected: 'en-CA' },
    { locale: 'de', expected: 'en-CA' },
  ])('maps $locale to $expected', ({ locale, expected }) => {
    expect(intlLocale(locale)).toBe(expected)
  })
})

describe('foldAccents', () => {
  it.each([
    { input: 'La Panthère', expected: 'la panthere' },
    { input: 'Milaprès1000', expected: 'milapres1000' },
    { input: 'Entraînement', expected: 'entrainement' },
    { input: 'Québec', expected: 'quebec' },
    { input: 'Faux Mouvement', expected: 'faux mouvement' },
  ])('folds $input', ({ input, expected }) => {
    expect(foldAccents(input)).toBe(expected)
  })

  it('leaves an already folded string alone', () => {
    expect(foldAccents('plain text')).toBe('plain text')
  })
})

describe('foldedIncludes', () => {
  it.each([
    { haystack: 'La Panthère', needle: 'panthere' },
    { haystack: 'La Panthère', needle: 'panthère' },
    { haystack: 'Entraînement du mardi', needle: 'entrainement' },
    { haystack: 'Café de Course', needle: 'cafe' },
  ])('matches $needle inside $haystack', ({ haystack, needle }) => {
    expect(foldedIncludes(haystack, foldAccents(needle))).toBe(true)
  })

  it('still rejects a genuine non-match', () => {
    expect(foldedIncludes('La Panthère', foldAccents('volt'))).toBe(false)
  })

  it.each([{ value: null }, { value: undefined }, { value: '' }])(
    'treats $value as no match',
    ({ value }) => {
      expect(foldedIncludes(value, 'x')).toBe(false)
    }
  )
})

describe('formatEventDate', () => {
  const JULY_29 = '2026-07-29T10:00:00.000Z'

  it('formats in French for the fr locale', () => {
    expect(formatEventDate(JULY_29, 'fr')).toBe('mer. 29 juill.')
  })

  it('formats in English for the en locale', () => {
    expect(formatEventDate(JULY_29, 'en')).toBe('Wed, Jul 29')
  })

  it('accepts a Date as well as a string', () => {
    expect(formatEventDate(new Date(JULY_29), 'en')).toBe('Wed, Jul 29')
  })

  it('honours custom options', () => {
    expect(
      formatEventDate(JULY_29, 'en', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
    ).toBe('Wednesday, July 29')
  })

  it('uses the Quebec time zone, not the runtime default', () => {
    // 01:30 UTC is still the previous evening in Toronto
    expect(formatEventDate('2026-07-30T01:30:00.000Z', 'en')).toBe(
      'Wed, Jul 29'
    )
  })

  it('returns an empty string for an unparseable date', () => {
    expect(formatEventDate('not-a-date', 'fr')).toBe('')
  })
})
