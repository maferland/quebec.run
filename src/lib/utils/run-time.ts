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
