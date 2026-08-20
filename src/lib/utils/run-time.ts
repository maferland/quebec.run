const TORONTO_TIME_ZONE = 'America/Toronto'

function torontoDateTimeParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TORONTO_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)

  return Object.fromEntries(parts.map(({ type, value }) => [type, value]))
}

export function getTorontoMinutes(date = new Date()) {
  const parts = torontoDateTimeParts(date)
  return Number(parts.hour) * 60 + Number(parts.minute)
}

export function runTimeMinutes(time: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(time)
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null
  return hours * 60 + minutes
}

export function isRunTimePast(time: string, nowMinutes: number) {
  const minutes = runTimeMinutes(time)
  return minutes !== null && minutes < nowMinutes
}

export function isRunPast(date: string, time: string, now: Date) {
  const runDate = new Date(date)
  const minutes = runTimeMinutes(time)
  if (Number.isNaN(runDate.getTime()) || minutes === null) return false

  const run = torontoDateTimeParts(runDate)
  const current = torontoDateTimeParts(now)
  const runKey = `${run.year}-${run.month}-${run.day}T${time}`
  const currentKey = `${current.year}-${current.month}-${current.day}T${current.hour}:${current.minute}`
  return runKey < currentKey
}

function getTorontoDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TORONTO_TIME_ZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(date)
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value)
  return { year: value('year'), month: value('month'), day: value('day') }
}

function getTorontoOffset(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TORONTO_TIME_ZONE,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).formatToParts(date)
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value)
  return (
    Date.UTC(
      value('year'),
      value('month') - 1,
      value('day'),
      value('hour'),
      value('minute'),
      value('second')
    ) - date.getTime()
  )
}

function torontoMidnight(year: number, month: number, day: number) {
  const utcGuess = Date.UTC(year, month - 1, day)
  const first = new Date(utcGuess - getTorontoOffset(new Date(utcGuess)))
  return new Date(utcGuess - getTorontoOffset(first))
}

// Returns {start, end} UTC boundaries for a Toronto calendar day offset from today.
export function getTorontoDayBounds(
  dayOffset: number,
  now = new Date()
): { start: Date; end: Date } {
  const today = getTorontoDateParts(now)
  const target = new Date(
    Date.UTC(today.year, today.month - 1, today.day + dayOffset)
  )
  const next = new Date(
    Date.UTC(today.year, today.month - 1, today.day + dayOffset + 1)
  )
  const start = torontoMidnight(
    target.getUTCFullYear(),
    target.getUTCMonth() + 1,
    target.getUTCDate()
  )
  const nextStart = torontoMidnight(
    next.getUTCFullYear(),
    next.getUTCMonth() + 1,
    next.getUTCDate()
  )
  const end = new Date(nextStart.getTime() - 1)
  return { start, end }
}

// Toronto midnight of the next occurrence of a weekday, at least minWeeksOut
// weeks away — for scheduling one-off overrides against a recurring pattern.
export function nextTorontoOccurrence(
  targetWeekday: number,
  minWeeksOut: number,
  now = new Date()
): Date {
  const currentWeekday = getTorontoDayBounds(0, now).start.getUTCDay()
  const daysToTarget = (targetWeekday - currentWeekday + 7) % 7 || 7
  return getTorontoDayBounds(daysToTarget + minWeeksOut * 7, now).start
}
