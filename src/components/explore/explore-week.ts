import type { WeekDay } from './week-bar'
import { intlLocale } from '@/lib/utils/intl'

export type WeekCount = { day: number; count: number }

export function buildWeekDays({
  counts,
  locale,
  todayLabel,
  tomorrowLabel,
}: {
  counts: WeekCount[]
  locale: string
  todayLabel: string
  tomorrowLabel: string
}): WeekDay[] {
  const loc = intlLocale(locale)
  const weekdayFormat = new Intl.DateTimeFormat(loc, { weekday: 'short' })
  const dateFormat = new Intl.DateTimeFormat(loc, {
    day: 'numeric',
    month: 'short',
  })
  const countByDay = new Map(counts.map(({ day, count }) => [day, count]))

  return Array.from({ length: 7 }, (_, offset) => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() + offset)

    const short =
      offset === 0
        ? todayLabel
        : offset === 1
          ? tomorrowLabel
          : weekdayFormat.format(date).replace('.', '').toUpperCase()

    return {
      offset,
      short,
      dateLabel: dateFormat.format(date).replace('.', ''),
      count: countByDay.get(offset) ?? 0,
    }
  })
}
