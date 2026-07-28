import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildWeekDays } from './explore-week'

const build = (locale: string, counts: { day: number; count: number }[] = []) =>
  buildWeekDays({
    counts,
    locale,
    todayLabel: 'Ce soir',
    tomorrowLabel: 'Demain',
  })

beforeEach(() => {
  // A Wednesday, so the weekday labels are predictable
  vi.setSystemTime(new Date('2026-07-29T12:00:00'))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('buildWeekDays', () => {
  it('returns seven consecutive days starting today', () => {
    const week = build('fr')

    expect(week).toHaveLength(7)
    expect(week.map((d) => d.offset)).toEqual([0, 1, 2, 3, 4, 5, 6])
  })

  it('uses the supplied labels for today and tomorrow', () => {
    const week = build('fr')

    expect(week[0].short).toBe('Ce soir')
    expect(week[1].short).toBe('Demain')
  })

  it('uses uppercase weekday abbreviations from day two onward', () => {
    expect(build('fr')[2].short).toBe('VEN')
    expect(build('en')[2].short).toBe('FRI')
  })

  it.each([
    { locale: 'fr', expected: '29 juill' },
    { locale: 'en', expected: 'Jul 29' },
  ])('formats $locale date labels', ({ locale, expected }) => {
    expect(build(locale)[0].dateLabel).toBe(expected)
  })

  it('maps counts onto their day offset', () => {
    const week = build('fr', [
      { day: 0, count: 8 },
      { day: 3, count: 2 },
    ])

    expect(week[0].count).toBe(8)
    expect(week[3].count).toBe(2)
  })

  it('defaults a day with no count to zero', () => {
    expect(build('fr', [{ day: 0, count: 8 }])[1].count).toBe(0)
  })

  it('ignores counts outside the seven-day window', () => {
    const week = build('fr', [{ day: 42, count: 99 }])

    expect(week.every((d) => d.count === 0)).toBe(true)
  })
})
