import { Link } from '@/i18n/navigation'
import { useTranslations, useFormatter } from 'next-intl'
import { Card } from '@/components/ui/card'
import { Tag } from '@/components/ui/tag'
import { LocationCard } from '@/components/ui/location'
import { Icon } from '@/components/ui/icon'
import { eventUrl } from '@/lib/utils/event-url'
import { formatDateTime } from '@/lib/utils/date-formatting'
import { Calendar, Clock, Repeat } from 'lucide-react'
import type { EventLocation } from '@/lib/services/events'

export type EventLocationCardProps = {
  location: EventLocation
}

const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const

export function EventLocationCard({ location }: EventLocationCardProps) {
  const t = useTranslations('events')
  const format = useFormatter()

  const orderedWeekdays = [...location.weekdays].sort(
    (a, b) =>
      WEEKDAY_ORDER.indexOf(a as (typeof WEEKDAY_ORDER)[number]) -
      WEEKDAY_ORDER.indexOf(b as (typeof WEEKDAY_ORDER)[number])
  )
  const weekdayLabels = orderedWeekdays.map((day) => {
    const reference = new Date(2024, 0, 7 + day)
    return format.dateTime(reference, { weekday: 'long' })
  })
  const recurrence = format.list(weekdayLabels)

  const showDistinctTitle =
    location.title.trim().toLowerCase() !==
    location.club.name.trim().toLowerCase()

  return (
    <Card as="article" variant="interactive" className="flex flex-col">
      <Link
        href={eventUrl(location.next)}
        className="mb-3 flex items-start justify-between gap-3"
      >
        <div className="flex-1 min-w-0">
          <p className="mb-1 text-[11px] font-heading font-semibold uppercase tracking-wider text-text-secondary">
            {location.club.name}
          </p>
          {showDistinctTitle && (
            <h3 className="text-lg font-heading font-bold text-primary hover:underline line-clamp-2 leading-tight">
              {location.title}
            </h3>
          )}
        </div>
        <Tag variant="datetime" icon={Clock} size="xs">
          {formatDateTime(location.next.date, location.next.time)}
        </Tag>
      </Link>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 text-xs text-text-secondary">
          <Icon icon={Calendar} size="xs" decorative />
          {recurrence}
        </span>
        {location.isRecurring && (
          <Tag colorScheme="primary" icon={Repeat} size="xs">
            {t('locations.recurring')}
          </Tag>
        )}
        {location.next.distance && (
          <Tag variant="distance" size="xs">
            {location.next.distance}
          </Tag>
        )}
        {location.next.pace && (
          <Tag variant="pace" size="xs">
            {location.next.pace}
          </Tag>
        )}
      </div>

      {location.address && <LocationCard address={location.address} />}

      {location.occurrenceCount > 1 && (
        <p className="mt-3 text-xs text-text-secondary">
          {t('locations.upcomingCount', {
            count: location.occurrenceCount,
          })}
        </p>
      )}
    </Card>
  )
}
