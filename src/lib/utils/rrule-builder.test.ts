import { describe, it, expect } from 'vitest'
import {
  buildRRuleString,
  parseRRuleToForm,
  validateRRulePattern,
  describePattern,
} from './rrule-builder'

describe('buildRRuleString', () => {
  it('builds weekly pattern with single day', () => {
    const rrule = buildRRuleString({
      frequency: 'weekly',
      interval: 1,
      byweekday: ['TU'],
      time: '18:00',
      until: null,
    })

    expect(rrule).toBe('FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0')
  })

  it('builds weekly pattern with multiple days', () => {
    const rrule = buildRRuleString({
      frequency: 'weekly',
      interval: 1,
      byweekday: ['MO', 'WE', 'FR'],
      time: '06:30',
      until: null,
    })

    expect(rrule).toBe('FREQ=WEEKLY;BYDAY=MO,WE,FR;BYHOUR=6;BYMINUTE=30')
  })

  it('builds biweekly pattern', () => {
    const rrule = buildRRuleString({
      frequency: 'biweekly',
      interval: 2,
      byweekday: ['SA'],
      time: '08:00',
      until: null,
    })

    expect(rrule).toBe('FREQ=WEEKLY;INTERVAL=2;BYDAY=SA;BYHOUR=8;BYMINUTE=0')
  })

  it('includes until date when provided', () => {
    const until = new Date('2025-12-31')
    const rrule = buildRRuleString({
      frequency: 'weekly',
      interval: 1,
      byweekday: ['TU'],
      time: '18:00',
      until,
    })

    expect(rrule).toContain('UNTIL=20251231')
  })
})

describe('parseRRuleToForm', () => {
  it('parses weekly pattern to form', () => {
    const form = parseRRuleToForm('FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0')

    expect(form).toEqual({
      frequency: 'weekly',
      interval: 1,
      byweekday: ['TU'],
      time: '18:00',
      until: null,
    })
  })

  it('parses biweekly pattern to form', () => {
    const form = parseRRuleToForm(
      'FREQ=WEEKLY;INTERVAL=2;BYDAY=SA;BYHOUR=8;BYMINUTE=0'
    )

    expect(form).toEqual({
      frequency: 'biweekly',
      interval: 2,
      byweekday: ['SA'],
      time: '08:00',
      until: null,
    })
  })

  it('parses pattern with multiple days', () => {
    const form = parseRRuleToForm(
      'FREQ=WEEKLY;BYDAY=MO,WE,FR;BYHOUR=6;BYMINUTE=30'
    )

    expect(form).toEqual({
      frequency: 'weekly',
      interval: 1,
      byweekday: ['MO', 'WE', 'FR'],
      time: '06:30',
      until: null,
    })
  })

  it('parses pattern with until date', () => {
    const form = parseRRuleToForm(
      'FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0;UNTIL=20251231'
    )

    expect(form.frequency).toBe('weekly')
    expect(form.byweekday).toEqual(['TU'])
    expect(form.time).toBe('18:00')
    expect(form.until).toBeInstanceOf(Date)
    expect(form.until?.getFullYear()).toBe(2025)
  })
})

describe('validateRRulePattern', () => {
  it('accepts valid weekly pattern', () => {
    expect(() => {
      validateRRulePattern('FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0')
    }).not.toThrow()
  })

  it('throws on invalid RRule syntax', () => {
    expect(() => {
      validateRRulePattern('INVALID_PATTERN')
    }).toThrow('Invalid recurrence pattern')
  })

  it('throws on pattern generating too many events', () => {
    expect(() => {
      validateRRulePattern('FREQ=DAILY;BYHOUR=18;BYMINUTE=0')
    }).toThrow('generates too many events')
  })

  it('accepts biweekly pattern under limit', () => {
    expect(() => {
      validateRRulePattern(
        'FREQ=WEEKLY;INTERVAL=2;BYDAY=SA;BYHOUR=8;BYMINUTE=0'
      )
    }).not.toThrow()
  })
})

describe('describePattern', () => {
  const cases: Array<{
    pattern: string
    en: string
    fr: string
  }> = [
    {
      pattern: 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=30',
      en: 'Every Tuesday at 18:30',
      fr: 'Tous les mardis à 18 h 30',
    },
    {
      pattern: 'FREQ=WEEKLY;BYDAY=SU;BYHOUR=8;BYMINUTE=0',
      en: 'Every Sunday at 08:00',
      fr: 'Tous les dimanches à 8 h 00',
    },
    {
      pattern: 'FREQ=WEEKLY;BYDAY=MO,WE,FR;BYHOUR=6;BYMINUTE=30',
      en: 'Every Monday, Wednesday, and Friday at 06:30',
      fr: 'Tous les lundi, mercredi, et vendredi à 6 h 30',
    },
    {
      pattern: 'FREQ=WEEKLY;BYDAY=TU,TH;BYHOUR=18;BYMINUTE=0',
      en: 'Every Tuesday and Thursday at 18:00',
      fr: 'Tous les mardi et jeudi à 18 h 00',
    },
    {
      pattern: 'FREQ=WEEKLY;INTERVAL=2;BYDAY=SA;BYHOUR=9;BYMINUTE=30',
      en: 'Every 2 weeks on Saturday at 09:30',
      fr: 'Toutes les 2 semaines le samedi à 9 h 30',
    },
  ]

  it.each(cases)('describes $pattern in English', ({ pattern, en }) => {
    expect(describePattern(pattern, 'en')).toBe(en)
  })

  it.each(cases)('describes $pattern in French', ({ pattern, fr }) => {
    expect(describePattern(pattern, 'fr')).toBe(fr)
  })

  it('returns null for monthly patterns', () => {
    expect(describePattern('FREQ=MONTHLY;BYMONTHDAY=1', 'en')).toBeNull()
  })

  it('returns null for patterns without BYDAY', () => {
    expect(describePattern('FREQ=WEEKLY;BYHOUR=18;BYMINUTE=0', 'en')).toBeNull()
  })
})
