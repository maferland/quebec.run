import type { Event } from '@/lib/schemas'
import { Tag } from '@/components/ui/tag'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { MapPin } from 'lucide-react'

export type EventCardProps = {
  event: Event & {
    club?: {
      id: string
      name: string
    }
  }
  showClubName?: boolean
}

export function EventCard({ event, showClubName = false }: EventCardProps) {
  return (
    <Link href={`/events/${event.id}`}>
      <Card variant="accent">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {event.title}
            </h3>
            {showClubName && event.club && (
              <p className="text-sm text-gray-600 mb-2">{event.club.name}</p>
            )}
          </div>
          <Tag variant="time">{event.time}</Tag>
        </div>

        {event.description && (
          <p className="text-gray-700 mb-4 text-lg leading-relaxed">
            {event.description}
          </p>
        )}

        {/* Event Details with Tags */}
        <div className="flex items-center gap-3 flex-wrap mb-4">
          <Tag variant="date">
            {new Date(event.date).toLocaleDateString('fr-CA', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Tag>

          {event.distance && <Tag variant="distance">{event.distance}</Tag>}
          {event.pace && <Tag variant="pace">{event.pace}</Tag>}
        </div>

        {/* Location */}
        {event.address && (
          <div className="flex items-start gap-3 p-4 bg-white rounded-lg border">
            <MapPin className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900 mb-1">Location</p>
              <p className="text-gray-700">{event.address}</p>
            </div>
          </div>
        )}
      </Card>
    </Link>
  )
}
