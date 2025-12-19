import { describe, it, expect } from 'vitest'
import { buildRRuleString, parseRRuleToForm } from './rrule-builder'

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
