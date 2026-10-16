import type { WeekDay } from './week-bar'
import type { WeekCount } from '@/lib/hooks/use-explore'
import { intlLocale } from '@/lib/utils/intl'
import { getTorontoDayBounds } from '@/lib/utils/run-time'

export function buildWeekDays({
  counts,
  locale,
  todayLabel,
  tomorrowLabel,
  now = new Date(),
}: {
  counts: WeekCount[]
  locale: string
  todayLabel: string
  tomorrowLabel: string
  now?: Date
}): WeekDay[] {
  const loc = intlLocale(locale)
  const weekdayFormat = new Intl.DateTimeFormat(loc, {
    weekday: 'short',
    timeZone: 'America/Toronto',
  })
  const dateFormat = new Intl.DateTimeFormat(loc, {
    day: 'numeric',
    month: 'short',
    timeZone: 'America/Toronto',
  })
  const countByDay = new Map(counts.map(({ day, count }) => [day, count]))

  return Array.from({ length: 7 }, (_, offset) => {
    const date = getTorontoDayBounds(offset, now).start

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
