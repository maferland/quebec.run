/**
 * Date and time formatting utilities for consistent formatting across the app
 * Provides locale-aware formatting with defaults for quebec.run
 */

export type DateFormatOptions = {
  locale?: string
  timezone?: string
}

export type EventDateFormat = 'full' | 'abbreviated' | 'compact' | 'dayOnly'
export type EventTimeFormat = 'standard' | 'military' | 'compact'

const DEFAULT_LOCALE = 'en-US'
const DEFAULT_FR_LOCALE = 'fr-CA'
const DEFAULT_TIMEZONE = 'America/Montreal'

// Event-specific date formatting configurations
const eventDateFormats = {
  full: {
    weekday: 'long' as const,
    month: 'long' as const,
    day: 'numeric' as const,
  },
  abbreviated: {
    weekday: 'short' as const,
    month: 'short' as const,
    day: 'numeric' as const,
  },
  compact: {
    month: 'short' as const,
    day: 'numeric' as const,
  },
  dayOnly: {
    weekday: 'long' as const,
  },
}

/**
 * Format event date for display in event cards and components
 */
export function formatEventDate(
  date: Date | string,
  format: EventDateFormat = 'abbreviated',
  options: DateFormatOptions = {}
): string {
  let dateObj: Date

  if (typeof date === 'string') {
    // Handle string dates consistently - add time portion to avoid timezone issues
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      dateObj = new Date(date + 'T12:00:00')
    } else {
      dateObj = new Date(date)
    }
  } else {
    dateObj = date
  }

  const { locale = DEFAULT_LOCALE, timezone = DEFAULT_TIMEZONE } = options

  return dateObj.toLocaleDateString(locale, {
    ...eventDateFormats[format],
    timeZone: timezone,
  })
}

/**
 * Format event time for display in event cards
 */
export function formatEventTime(
  time: string,
  format: EventTimeFormat = 'standard'
): string {
  // Handle different time input formats
  const timeStr = time.includes(':') ? time : `${time.padStart(2, '0')}:00`

  // Check if it's a valid time format
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5]?[0-9])$/
  if (!timeRegex.test(timeStr)) {
    return time // Return original if invalid
  }

  try {
    // Create a temporary date to parse the time
    const tempDate = new Date(`2000-01-01T${timeStr}`)

    if (isNaN(tempDate.getTime())) {
      return time
    }

    switch (format) {
      case 'military':
        return tempDate.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
        })
      case 'compact':
        return tempDate
          .toLocaleTimeString('en-US', {
            hour12: true,
            hour: 'numeric',
            minute: '2-digit',
          })
          .replace(' ', '')
          .toLowerCase()
      case 'standard':
      default:
        return tempDate.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
        })
    }
  } catch {
    // Fallback to original string if parsing fails
    return time
  }
}

/**
 * Format combined date and time for display (like in datetime tags)
 */
export function formatDateTime(
  date: Date | string,
  time: string,
  options: DateFormatOptions = {}
): string {
  const formattedDate = formatEventDate(date, 'abbreviated', options)
  const formattedTime = formatEventTime(time, 'standard')

  return `${formattedDate} • ${formattedTime}`
}

/**
 * Format event date for French locale (for club cards and French content)
 */
export function formatEventDateFr(
  date: Date | string,
  format: EventDateFormat = 'abbreviated'
): string {
  return formatEventDate(date, format, { locale: DEFAULT_FR_LOCALE })
}

/**
 * Format relative time (e.g., "in 2 days", "tomorrow")
 */
export function formatRelativeDate(date: Date | string): string {
  let dateObj: Date

  if (typeof date === 'string') {
    // Handle string dates consistently - add time portion to avoid timezone issues
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      dateObj = new Date(date + 'T12:00:00')
    } else {
      dateObj = new Date(date)
    }
  } else {
    dateObj = date
  }

  const now = new Date()
  const diffInDays = Math.ceil(
    (dateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (diffInDays === 0) return 'Today'
  if (diffInDays === 1) return 'Tomorrow'
  if (diffInDays === -1) return 'Yesterday'
  if (diffInDays > 1 && diffInDays <= 7) return `In ${diffInDays} days`
  if (diffInDays < -1 && diffInDays >= -7)
    return `${Math.abs(diffInDays)} days ago`

  // For dates further out, use standard formatting
  return formatEventDate(dateObj, 'compact')
}

/**
 * Format human-friendly date that prioritizes readability
 * Shows "Today", "Tomorrow", "This Monday", or "Mon, Aug 18"
 */
export function formatHumanFriendlyDate(
  date: Date | string,
  options: DateFormatOptions = {}
): string {
  let dateObj: Date

  if (typeof date === 'string') {
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      dateObj = new Date(date + 'T12:00:00')
    } else {
      dateObj = new Date(date)
    }
  } else {
    dateObj = date
  }

  const { locale = DEFAULT_LOCALE, timezone = DEFAULT_TIMEZONE } = options
  const now = new Date()
  const diffInDays = Math.ceil(
    (dateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )

  // Handle nearby dates with friendly terms
  if (diffInDays === 0) return 'Today'
  if (diffInDays === 1) return 'Tomorrow'
  if (diffInDays === -1) return 'Yesterday'

  // For dates within the current month, show "Mon, Aug 18"
  if (
    dateObj.getMonth() === now.getMonth() &&
    dateObj.getFullYear() === now.getFullYear()
  ) {
    return dateObj.toLocaleDateString(locale, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: timezone,
    })
  }

  // For dates in other months this year, show "Mon, Aug 18"
  if (dateObj.getFullYear() === now.getFullYear()) {
    return dateObj.toLocaleDateString(locale, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: timezone,
    })
  }

  // For dates in other years, show "Mon, Aug 18, 2025"
  return dateObj.toLocaleDateString(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: timezone,
  })
}

/**
 * Check if a date is today
 */
export function isToday(date: Date | string): boolean {
  let dateObj: Date

  if (typeof date === 'string') {
    // Handle string dates consistently - add time portion to avoid timezone issues
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      dateObj = new Date(date + 'T12:00:00')
    } else {
      dateObj = new Date(date)
    }
  } else {
    dateObj = date
  }

  const today = new Date()

  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  )
}

/**
 * Check if a date is in the future
 */
export function isFuture(date: Date | string): boolean {
  let dateObj: Date

  if (typeof date === 'string') {
    // Handle string dates consistently - add time portion to avoid timezone issues
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      dateObj = new Date(date + 'T12:00:00')
    } else {
      dateObj = new Date(date)
    }
  } else {
    dateObj = date
  }

  return dateObj.getTime() > new Date().getTime()
}

/**
 * Get the day of the week in French (for quebec.run content)
 */
export function getDayOfWeekFr(date: Date | string): string {
  let dateObj: Date

  if (typeof date === 'string') {
    // Handle string dates consistently - add time portion to avoid timezone issues
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      dateObj = new Date(date + 'T12:00:00')
    } else {
      dateObj = new Date(date)
    }
  } else {
    dateObj = date
  }

  return dateObj.toLocaleDateString('fr-CA', { weekday: 'long' })
}

/**
 * Format duration for running events (e.g., "1h 30m", "45m")
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (remainingMinutes === 0) {
    return `${hours}h`
  }

  return `${hours}h ${remainingMinutes}m`
}

/**
 * Parse common time input formats to standardized HH:MM format
 */
export function normalizeTimeString(time: string): string {
  // Handle various input formats: "6", "6:00", "06:00", "6AM", "18:00"
  const cleaned = time.replace(/\s+/g, '').toLowerCase()

  // Handle AM/PM format
  if (cleaned.includes('am') || cleaned.includes('pm')) {
    const isPM = cleaned.includes('pm')
    const numPart = cleaned.replace(/[ap]m/, '')
    const [hourStr, minuteStr = '00'] = numPart.split(':')
    let hour = parseInt(hourStr, 10)

    if (isPM && hour !== 12) hour += 12
    if (!isPM && hour === 12) hour = 0

    return `${hour.toString().padStart(2, '0')}:${minuteStr.padStart(2, '0')}`
  }

  // Handle 24-hour format
  if (cleaned.includes(':')) {
    const [hourStr, minuteStr] = cleaned.split(':')
    const hour = parseInt(hourStr, 10)
    const minute = parseInt(minuteStr, 10)

    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
  }

  // Handle hour-only format (assume 24-hour)
  const hour = parseInt(cleaned, 10)
  return `${hour.toString().padStart(2, '0')}:00`
}

/**
 * Collection of date formatting utilities
 */
export const dateUtils = {
  formatEventDate,
  formatEventTime,
  formatDateTime,
  formatEventDateFr,
  formatRelativeDate,
  formatHumanFriendlyDate,
  isToday,
  isFuture,
  formatDuration,
  normalizeTimeString,
}
