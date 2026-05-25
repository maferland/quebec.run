import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { Card } from '@/components/ui/card'
import { Tag } from '@/components/ui/tag'
import { LocationCard } from '@/components/ui/location'
import { eventUrl } from '@/lib/utils/event-url'
import { formatDateTime } from '@/lib/utils/date-formatting'
import { Clock, BookmarkCheck } from 'lucide-react'
import type { GetAllEventsReturn } from '@/lib/services/events'

export type OverrideEventCardProps = {
  event: GetAllEventsReturn
}

export function OverrideEventCard({ event }: OverrideEventCardProps) {
  const t = useTranslations('events')

  return (
    <Link href={eventUrl(event)} className="block">
      <Card as="article" variant="interactive" className="flex flex-col">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <Tag colorScheme="secondary" icon={BookmarkCheck} size="xs">
                {t('locations.takeNote')}
              </Tag>
            </div>
            <h3 className="text-lg font-heading font-bold text-primary hover:underline mb-1 line-clamp-2 leading-tight">
              {event.title}
            </h3>
            {event.club && (
              <p className="text-xs text-accent font-body">{event.club.name}</p>
            )}
          </div>
          <Tag variant="datetime" icon={Clock} size="xs">
            {formatDateTime(event.date, event.time)}
          </Tag>
        </div>

        {(event.distance || event.pace) && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {event.distance && (
              <Tag variant="distance" size="xs">
                {event.distance}
              </Tag>
            )}
            {event.pace && (
              <Tag variant="pace" size="xs">
                {event.pace}
              </Tag>
            )}
          </div>
        )}

        {event.address && <LocationCard address={event.address} />}
      </Card>
    </Link>
  )
}
