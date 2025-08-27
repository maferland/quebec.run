import type { GetAllEventsReturn } from '@/lib/services/events'
import { Tag } from '@/components/ui/tag'
import { Card } from '@/components/ui/card'
import { LocationCard } from '@/components/ui/location'
import { formatDateTime } from '@/lib/utils/date-formatting'
import { Link } from '@/i18n/navigation'
import { Clock } from 'lucide-react'

export type EventCardProps = {
  event: GetAllEventsReturn
  showClubName?: boolean
}

export function EventCard({ event, showClubName = false }: EventCardProps) {
  return (
    <Link href={`/events/${event.id}`} className="block h-full">
      <Card variant="interactive" className="h-full flex flex-col">
        {/* Fixed height header section */}
        <div className="h-16 mb-3">
          <div className="flex items-start gap-3 h-full">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-heading font-bold text-primary mb-2 line-clamp-2 leading-tight">
                {event.title}
              </h3>
              {showClubName && event.club && (
                <p className="text-xs text-accent font-body">
                  {event.club.name}
                </p>
              )}
            </div>
            <div className="flex-shrink-0 self-start">
              <Tag variant="datetime" icon={Clock} size="xs">
                {formatDateTime(event.date, event.time)}
              </Tag>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {/* Event Details with Tags */}
          <div className="flex items-center gap-2 flex-wrap mb-4 pt-2">
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

          {/* Location - Always present but conditionally visible */}
          <div className="mt-auto">
            {event.address ? (
              <LocationCard address={event.address} />
            ) : (
              <div className="h-16" />
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}
