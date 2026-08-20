import { afterEach, describe, expect, it } from 'vitest'
import {
  getTorontoMinutes,
  isRunPast,
  isRunTimePast,
  nextTorontoOccurrence,
  runTimeMinutes,
} from './run-time'

describe('run time', () => {
  it.each([
    ['before a 06:00 run', 5 * 60 + 59, false],
    ['at a 06:00 run', 6 * 60, false],
    ['after a 06:00 run', 6 * 60 + 1, true],
  ])('%s', (_label, nowMinutes, expected) => {
    expect(isRunTimePast('06:00', nowMinutes)).toBe(expected)
  })

  it('uses Toronto time independently of the runtime timezone', () => {
    expect(getTorontoMinutes(new Date('2026-07-22T12:00:00.000Z'))).toBe(480)
  })

  it.each(['6:00', '24:00', '06:60', 'invalid'])(
    'rejects malformed time %s',
    (time) => {
      expect(runTimeMinutes(time)).toBeNull()
      expect(isRunTimePast(time, 600)).toBe(false)
    }
  )

  it.each([
    ['earlier Toronto date', '2026-07-21T22:00:00.000Z', '23:59', true],
    ['later Toronto date', '2026-07-23T05:00:00.000Z', '00:01', false],
    ['earlier same-day time', '2026-07-22T16:00:00.000Z', '07:59', true],
    ['later same-day time', '2026-07-22T16:00:00.000Z', '08:01', false],
  ])('%s', (_label, date, time, expected) => {
    expect(isRunPast(date, time, new Date('2026-07-22T12:00:00.000Z'))).toBe(
      expected
    )
  })

  describe('nextTorontoOccurrence', () => {
    const originalTz = process.env.TZ

    afterEach(() => {
      process.env.TZ = originalTz
    })

    it.each(['UTC', 'America/Toronto', 'Asia/Tokyo'])(
      'anchors to Toronto midnight regardless of the process TZ (%s)',
      (tz) => {
        process.env.TZ = tz
        const now = new Date('2026-08-12T15:00:00.000Z')
        const result = nextTorontoOccurrence(2, 1, now)

        // setHours(0, 0, 0, 0) on a non-Eastern runner misses this boundary.
        expect(result.toISOString()).toBe('2026-08-25T04:00:00.000Z')
        expect(result.getUTCDay()).toBe(2)
      }
    )
  })
})
