import { Link } from '@/i18n/navigation'
import { useTranslations, useFormatter } from 'next-intl'
import { Card } from '@/components/ui/card'
import { Tag } from '@/components/ui/tag'
import { LocationCard } from '@/components/ui/location'
import { Icon } from '@/components/ui/icon'
import { eventUrl } from '@/lib/utils/event-url'
import { formatDateTime } from '@/lib/utils/date-formatting'
import { Calendar, Clock, Repeat, Sparkles } from 'lucide-react'
import type { EventLocation } from '@/lib/services/events'

export type EventLocationCardProps = {
  location: EventLocation
}

const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const

const MAX_NOTABLE = 3

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

  const showClubSubtitle = location.title !== location.club.name
  const notable = location.notable.slice(0, MAX_NOTABLE)
  const extraNotable = location.notable.length - notable.length

  return (
    <Card as="article" variant="interactive" className="flex flex-col">
      <Link
        href={eventUrl(location.next)}
        className="mb-3 flex items-start justify-between gap-3"
      >
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-heading font-bold text-primary hover:underline mb-1 line-clamp-2 leading-tight">
            {location.title}
          </h3>
          {showClubSubtitle && (
            <p className="text-xs text-accent font-body">
              {location.club.name}
            </p>
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

      {notable.length > 0 && (
        <section className="mt-4 border-t border-border/60 pt-3">
          <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-secondary">
            <Icon icon={Sparkles} size="xs" decorative />
            {t('locations.notableTitle')}
          </h4>
          <ul className="space-y-1.5 text-sm">
            {notable.map((event) => (
              <li key={event.id}>
                <Link
                  href={eventUrl(event)}
                  className="flex flex-wrap items-baseline gap-x-2 text-text-primary hover:underline"
                >
                  <span className="text-xs text-text-secondary">
                    {format.dateTime(event.date, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <span className="font-medium">{event.title}</span>
                </Link>
              </li>
            ))}
            {extraNotable > 0 && (
              <li className="text-xs text-text-secondary">
                {t('locations.moreNotable', { count: extraNotable })}
              </li>
            )}
          </ul>
        </section>
      )}

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
