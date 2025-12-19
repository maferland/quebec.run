import { describe, it, expect } from 'vitest'
import { buildRRuleString } from './rrule-builder'

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
