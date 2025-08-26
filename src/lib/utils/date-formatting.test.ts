import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  formatEventDate,
  formatEventTime,
  formatDateTime,
  formatEventDateFr,
  formatRelativeDate,
  isToday,
  isFuture,
  getDayOfWeekFr,
  formatDuration,
  normalizeTimeString,
  dateUtils,
} from './date-formatting'

describe('Date Formatting Utilities', () => {
  // Use a fixed date for consistent testing
  const testDate = new Date('2025-09-04T06:00:00-04:00') // Thursday, Sept 4, 2025, 6:00 AM EDT
  const testDateString = '2025-09-04'

  beforeEach(() => {
    // Mock the current date for consistent relative date testing
    vi.setSystemTime(new Date('2025-09-02T10:00:00-04:00')) // Tuesday, Sept 2, 2025
  })

  describe('formatEventDate', () => {
    it('formats date with full format', () => {
      const result = formatEventDate(testDate, 'full')
      expect(result).toBe('Thursday, September 4')
    })

    it('formats date with abbreviated format (default)', () => {
      const result = formatEventDate(testDate)
      expect(result).toBe('Thu, Sep 4')
    })

    it('formats date with compact format', () => {
      const result = formatEventDate(testDate, 'compact')
      expect(result).toBe('Sep 4')
    })

    it('formats date with day only format', () => {
      const result = formatEventDate(testDate, 'dayOnly')
      expect(result).toBe('Thursday')
    })

    it('handles string date input', () => {
      const result = formatEventDate(testDateString, 'abbreviated')
      expect(result).toBe('Thu, Sep 4')
    })

    it('respects custom locale', () => {
      const result = formatEventDate(testDate, 'abbreviated', {
        locale: 'fr-CA',
      })
      // French Canadian formatting
      expect(result).toContain('sept')
    })
  })

  describe('formatEventTime', () => {
    it('formats standard time in HH:MM format', () => {
      expect(formatEventTime('06:00')).toBe('06:00')
      expect(formatEventTime('18:30')).toBe('18:30')
      expect(formatEventTime('23:59')).toBe('23:59')
    })

    it('handles hour-only input', () => {
      expect(formatEventTime('6')).toBe('06:00')
      expect(formatEventTime('18')).toBe('18:00')
    })

    it('formats military time', () => {
      expect(formatEventTime('06:00', 'military')).toBe('06:00')
      expect(formatEventTime('18:30', 'military')).toBe('18:30')
    })

    it('formats compact time', () => {
      const result = formatEventTime('06:00', 'compact')
      expect(result).toContain('6:00')
      expect(result.toLowerCase()).toContain('am')
    })

    it('handles invalid time gracefully', () => {
      expect(formatEventTime('invalid')).toBe('invalid')
      expect(formatEventTime('25:70')).toBe('25:70')
    })
  })

  describe('formatDateTime', () => {
    it('combines date and time with bullet separator', () => {
      const result = formatDateTime(testDate, '06:00')
      expect(result).toBe('Thu, Sep 4 • 06:00')
    })

    it('works with string date input', () => {
      const result = formatDateTime(testDateString, '18:30')
      expect(result).toBe('Thu, Sep 4 • 18:30')
    })

    it('respects locale options', () => {
      const result = formatDateTime(testDate, '06:00', { locale: 'fr-CA' })
      expect(result).toContain('•')
      expect(result).toContain('06:00')
    })
  })

  describe('formatEventDateFr', () => {
    it('formats date in French Canadian locale', () => {
      const result = formatEventDateFr(testDate)
      expect(result).toContain('sept') // September in French
    })

    it('works with different formats', () => {
      const full = formatEventDateFr(testDate, 'full')
      const compact = formatEventDateFr(testDate, 'compact')

      expect(full).toContain('septembre')
      expect(compact).toContain('sept')
    })
  })

  describe('formatRelativeDate', () => {
    it('returns "Today" for current date', () => {
      const today = new Date('2025-09-02')
      expect(formatRelativeDate(today)).toBe('Today')
    })

    it('returns "Tomorrow" for next day', () => {
      const tomorrow = new Date('2025-09-03')
      expect(formatRelativeDate(tomorrow)).toBe('Tomorrow')
    })

    it('returns "Yesterday" for previous day', () => {
      const yesterday = new Date('2025-09-01')
      expect(formatRelativeDate(yesterday)).toBe('Yesterday')
    })

    it('returns "In X days" for future dates within a week', () => {
      const futureDate = new Date('2025-09-04') // 2 days from mocked "today"
      expect(formatRelativeDate(futureDate)).toBe('In 2 days')
    })

    it('returns "X days ago" for past dates within a week', () => {
      const pastDate = new Date('2025-08-31') // 2 days before mocked "today"
      expect(formatRelativeDate(pastDate)).toBe('2 days ago')
    })

    it('returns standard format for dates beyond a week', () => {
      const farFuture = new Date('2025-09-15T12:00:00')
      const result = formatRelativeDate(farFuture)
      expect(result).toBe('Sep 15') // Should use compact format
    })
  })

  describe('isToday', () => {
    it("returns true for today's date", () => {
      const today = new Date('2025-09-02T10:00:00-04:00') // Same as mocked time
      expect(isToday(today)).toBe(true)
    })

    it('returns false for other dates', () => {
      const notToday = new Date('2025-09-03T10:00:00-04:00')
      expect(isToday(notToday)).toBe(false)
    })

    it('works with string input', () => {
      expect(isToday('2025-09-02')).toBe(true)
      expect(isToday('2025-09-03')).toBe(false)
    })
  })

  describe('isFuture', () => {
    it('returns true for future dates', () => {
      const future = new Date('2025-09-03')
      expect(isFuture(future)).toBe(true)
    })

    it('returns false for past dates', () => {
      const past = new Date('2025-09-01')
      expect(isFuture(past)).toBe(false)
    })

    it('works with string input', () => {
      expect(isFuture('2025-09-03')).toBe(true)
      expect(isFuture('2025-09-01')).toBe(false)
    })
  })

  describe('getDayOfWeekFr', () => {
    it('returns French day of the week', () => {
      const result = getDayOfWeekFr(testDate)
      expect(result).toBe('jeudi') // Thursday in French
    })

    it('works with string input', () => {
      const result = getDayOfWeekFr(testDateString)
      expect(result).toBe('jeudi')
    })
  })

  describe('formatDuration', () => {
    it('formats minutes only for duration under 1 hour', () => {
      expect(formatDuration(30)).toBe('30m')
      expect(formatDuration(45)).toBe('45m')
      expect(formatDuration(59)).toBe('59m')
    })

    it('formats hours only for exact hours', () => {
      expect(formatDuration(60)).toBe('1h')
      expect(formatDuration(120)).toBe('2h')
      expect(formatDuration(180)).toBe('3h')
    })

    it('formats hours and minutes for mixed durations', () => {
      expect(formatDuration(90)).toBe('1h 30m')
      expect(formatDuration(135)).toBe('2h 15m')
      expect(formatDuration(245)).toBe('4h 5m')
    })

    it('handles zero duration', () => {
      expect(formatDuration(0)).toBe('0m')
    })
  })

  describe('normalizeTimeString', () => {
    it('normalizes hour-only format', () => {
      expect(normalizeTimeString('6')).toBe('06:00')
      expect(normalizeTimeString('18')).toBe('18:00')
      expect(normalizeTimeString('0')).toBe('00:00')
    })

    it('normalizes HH:MM format', () => {
      expect(normalizeTimeString('6:30')).toBe('06:30')
      expect(normalizeTimeString('18:45')).toBe('18:45')
      expect(normalizeTimeString('00:00')).toBe('00:00')
    })

    it('normalizes AM/PM format', () => {
      expect(normalizeTimeString('6AM')).toBe('06:00')
      expect(normalizeTimeString('6:30AM')).toBe('06:30')
      expect(normalizeTimeString('6PM')).toBe('18:00')
      expect(normalizeTimeString('6:30PM')).toBe('18:30')
      expect(normalizeTimeString('12AM')).toBe('00:00')
      expect(normalizeTimeString('12PM')).toBe('12:00')
    })

    it('handles spaces and case variations', () => {
      expect(normalizeTimeString(' 6 AM ')).toBe('06:00')
      expect(normalizeTimeString('6:30 pm')).toBe('18:30')
      expect(normalizeTimeString('12 PM')).toBe('12:00')
    })

    it('preserves valid 24-hour format', () => {
      expect(normalizeTimeString('06:00')).toBe('06:00')
      expect(normalizeTimeString('23:59')).toBe('23:59')
    })
  })

  describe('dateUtils collection', () => {
    it('provides all formatting utility functions', () => {
      expect(typeof dateUtils.formatEventDate).toBe('function')
      expect(typeof dateUtils.formatEventTime).toBe('function')
      expect(typeof dateUtils.formatDateTime).toBe('function')
      expect(typeof dateUtils.formatEventDateFr).toBe('function')
      expect(typeof dateUtils.formatRelativeDate).toBe('function')
      expect(typeof dateUtils.isToday).toBe('function')
      expect(typeof dateUtils.isFuture).toBe('function')
      expect(typeof dateUtils.formatDuration).toBe('function')
      expect(typeof dateUtils.normalizeTimeString).toBe('function')
    })

    it('works with direct function calls', () => {
      const result = dateUtils.formatEventDate(testDate, 'abbreviated')
      expect(result).toBe('Thu, Sep 4')
    })

    it('combines date and time correctly', () => {
      const result = dateUtils.formatDateTime(testDate, '06:00')
      expect(result).toBe('Thu, Sep 4 • 06:00')
    })
  })
})

describe('Real-world usage patterns', () => {
  const eventDate = new Date('2025-09-04T06:00:00-04:00')
  const eventTime = '06:00'

  it('formats event card datetime tag', () => {
    const result = formatDateTime(eventDate, eventTime)
    expect(result).toBe('Thu, Sep 4 • 06:00')
  })

  it('formats club card date tags', () => {
    const result = formatEventDateFr(eventDate, 'abbreviated')
    expect(result).toContain('sept')
  })

  it('handles various time input formats', () => {
    expect(normalizeTimeString('6')).toBe('06:00')
    expect(normalizeTimeString('6:00')).toBe('06:00')
    expect(normalizeTimeString('6AM')).toBe('06:00')
    expect(normalizeTimeString('18:00')).toBe('18:00')
  })

  it('provides consistent event listing formatting', () => {
    const events = [
      { date: '2025-09-04', time: '06:00' },
      { date: '2025-09-05', time: '18:30' },
      { date: '2025-09-06', time: '7' },
    ]

    events.forEach((event) => {
      const formatted = formatDateTime(event.date, event.time)
      expect(formatted).toMatch(/\w+, \w+ \d+ • \d{2}:\d{2}/)
    })
  })
})
