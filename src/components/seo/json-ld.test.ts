import { describe, expect, it } from 'vitest'
import { eventJsonLd, placeJsonLd } from './json-ld'

const baseEvent = {
  locale: 'en' as const,
  url: 'https://www.quebec.run/en/run/example',
  title: 'Morning Run',
  description: null,
  address: 'Quebec City',
  latitude: 46.8139,
  longitude: -71.208,
  clubName: 'Test Club',
  clubUrl: 'https://www.quebec.run/en/clubs/test-club',
}

describe('eventJsonLd', () => {
  it.each([
    ['2026-01-15T12:00:00.000Z', '06:00', '2026-01-15T06:00:00-05:00'],
    ['2026-07-15T12:00:00.000Z', '18:30', '2026-07-15T18:30:00-04:00'],
  ])(
    'uses the event time and Toronto offset for %s',
    (date, time, expected) => {
      const data = eventJsonLd({
        ...baseEvent,
        startDate: new Date(date),
        startTime: time,
      })

      expect(data.startDate).toBe(expected)
    }
  )

  it('publishes cancellation and language accurately', () => {
    const data = eventJsonLd({
      ...baseEvent,
      locale: 'fr',
      startDate: new Date('2026-07-15T12:00:00.000Z'),
      startTime: '18:30',
      status: 'CANCELLED',
    })

    expect(data.inLanguage).toBe('fr-CA')
    expect(data.eventStatus).toBe('https://schema.org/EventCancelled')
    expect(data).not.toHaveProperty('isAccessibleForFree')
  })
})

describe('placeJsonLd', () => {
  const basePlace = {
    locale: 'fr' as const,
    url: 'https://www.quebec.run/fr/clubs/6am-club/events/limoilou',
    title: '6AM Club Limoilou',
    description: null,
    address: '201 Av. 3e, Québec',
    latitude: 46.84,
    longitude: -71.22,
    clubName: '6AM Club',
    clubUrl: 'https://www.quebec.run/fr/clubs/6am-club',
  }

  it('describes the recurrence as a Schedule instead of one dated Event', () => {
    const data = placeJsonLd({
      ...basePlace,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=FR;BYHOUR=6;BYMINUTE=0',
      nextOccurrence: new Date('2026-08-07T12:00:00.000Z'),
    })

    expect(data.eventSchedule).toEqual({
      '@type': 'Schedule',
      repeatFrequency: 'P1W',
      byDay: ['https://schema.org/Friday'],
      startTime: '06:00:00',
      scheduleTimezone: 'America/Toronto',
    })
    expect(data.startDate).toBe('2026-08-07T06:00:00-04:00')
  })

  it('marks a biweekly pattern as P2W and omits startDate with no occurrence', () => {
    const data = placeJsonLd({
      ...basePlace,
      schedulePattern: 'FREQ=WEEKLY;INTERVAL=2;BYDAY=SA;BYHOUR=9;BYMINUTE=30',
      nextOccurrence: null,
    })

    expect(data.eventSchedule).toMatchObject({
      repeatFrequency: 'P2W',
      byDay: ['https://schema.org/Saturday'],
      startTime: '09:30:00',
    })
    expect(data.startDate).toBeUndefined()
  })
})
