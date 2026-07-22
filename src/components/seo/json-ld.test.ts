import { describe, expect, it } from 'vitest'
import { eventJsonLd } from './json-ld'

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
