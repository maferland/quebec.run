import { RRule } from 'rrule'

export type RecurrenceFormState = {
  frequency: 'weekly' | 'biweekly' | 'monthly'
  interval: number
  byweekday: string[] // ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']
  time: string // "HH:MM"
  until: Date | null
}

/**
 * Build RRule string from user-friendly form state
 * @param form - Form state with frequency, days, time
 * @returns RRule string (e.g., "FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0")
 */
export function buildRRuleString(form: RecurrenceFormState): string {
  const parts: string[] = []

  // Frequency
  if (form.frequency === 'monthly') {
    parts.push('FREQ=MONTHLY')
  } else {
    parts.push('FREQ=WEEKLY')
    if (form.interval > 1) {
      parts.push(`INTERVAL=${form.interval}`)
    }
  }

  // Days
  if (form.byweekday.length > 0) {
    parts.push(`BYDAY=${form.byweekday.join(',')}`)
  }

  // Time
  const [hour, minute] = form.time.split(':')
  const hourNum = parseInt(hour, 10)
  const minuteNum = parseInt(minute, 10)
  parts.push(`BYHOUR=${hourNum}`)
  parts.push(`BYMINUTE=${minuteNum}`)

  // Until
  if (form.until) {
    const year = form.until.getUTCFullYear()
    const month = String(form.until.getUTCMonth() + 1).padStart(2, '0')
    const day = String(form.until.getUTCDate()).padStart(2, '0')
    const formatted = `${year}${month}${day}`
    parts.push(`UNTIL=${formatted}`)
  }

  return parts.join(';')
}

/**
 * Parse RRule string to user-friendly form state
 * @param rruleString - RRule string from database
 * @returns Form state for UI
 */
export function parseRRuleToForm(rruleString: string): RecurrenceFormState {
  const rule = RRule.fromString(rruleString)
  const opts = rule.options

  // Determine frequency UI value
  let frequency: 'weekly' | 'biweekly' | 'monthly'
  const interval = opts.interval || 1

  if (opts.freq === RRule.MONTHLY) {
    frequency = 'monthly'
  } else if (interval === 2) {
    frequency = 'biweekly'
  } else {
    frequency = 'weekly'
  }

  // Extract days
  const byweekday = (opts.byweekday || []).map((d) => {
    const weekday =
      typeof d === 'number' ? d : (d as { weekday: number }).weekday
    return ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'][weekday]
  })

  // Extract time
  const hour = String(opts.byhour?.[0] || 0).padStart(2, '0')
  const minute = String(opts.byminute?.[0] || 0).padStart(2, '0')
  const time = `${hour}:${minute}`

  return {
    frequency,
    interval,
    byweekday,
    time,
    until: opts.until || null,
  }
}
