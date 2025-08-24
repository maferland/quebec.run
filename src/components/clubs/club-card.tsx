import type { GetAllClubsReturn } from '@/lib/services/clubs'
import { Link } from '@/components/ui/link'
import { Tag } from '@/components/ui/tag'
import { Card } from '@/components/ui/card'
import { Calendar } from 'lucide-react'

const MAX_EVENTS_TO_DISPLAY = 3

export type ClubCardProps = {
  club: GetAllClubsReturn
}

export function ClubCard({ club }: ClubCardProps) {
  const upcomingEvents = club.events || []
  const eventCount = upcomingEvents.length

  // Don't show the card if there are no upcoming events
  if (eventCount === 0) {
    return null
  }

  return (
    <Link
      href={`/clubs/${club.slug}`}
      className="block no-underline hover:no-underline"
    >
      <Card variant="interactive" data-testid="club-card">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <h2 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
            {club.name}
          </h2>

          {/* Event count badge */}
          <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            <Calendar className="h-3 w-3" />
            {eventCount}
          </div>
        </div>

        {/* Description - truncated */}
        {club.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {club.description}
          </p>
        )}

        {/* Upcoming Events - Horizontal Layout with Wrapping */}
        <div className="flex flex-wrap gap-3 mb-3">
          {upcomingEvents.slice(0, MAX_EVENTS_TO_DISPLAY).map((event) => (
            <div
              key={event.id}
              className="flex-1 min-w-[200px] p-3 bg-gray-100 rounded-lg border-l-4 border-blue-500"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {event.title}
                </p>
                <Tag variant="time">{event.time}</Tag>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Tag variant="date">
                  {new Date(event.date).toLocaleDateString('fr-CA', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </Tag>
                {event.distance && (
                  <Tag variant="distance">{event.distance}</Tag>
                )}
                {event.pace && <Tag variant="pace">{event.pace}</Tag>}
              </div>
            </div>
          ))}

          {eventCount > MAX_EVENTS_TO_DISPLAY && (
            <div className="flex-1 min-w-[120px] flex items-center justify-center p-3 bg-gray-100 rounded-lg">
              <p className="text-xs text-gray-500 text-center">
                +{eventCount - MAX_EVENTS_TO_DISPLAY} more this week
              </p>
            </div>
          )}
        </div>

        {/* Footer with vertically centered link */}
        <div className="flex items-center justify-center pt-3 border-t border-gray-200">
          <div className="text-xs text-blue-600 group-hover:text-blue-700 font-medium">
            View details →
          </div>
        </div>
      </Card>
    </Link>
  )
}
