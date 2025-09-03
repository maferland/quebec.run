import type { GetAllClubsReturn } from '@/lib/services/clubs'
import { Link } from '@/components/ui/link'
import { Tag } from '@/components/ui/tag'
import { Card } from '@/components/ui/card'
import { LocationInline } from '@/components/ui/location'
import { formatEventDateFr } from '@/lib/utils/date-formatting'
import { useTranslations } from 'next-intl'
import { Calendar, Users, Clock, MapPin } from 'lucide-react'

const MAX_EVENTS_TO_DISPLAY = 3

export type ClubCardProps = {
  club: GetAllClubsReturn
}

export function ClubCard({ club }: ClubCardProps) {
  const t = useTranslations('clubs.card')
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
      <Card
        variant="interactive"
        data-testid="club-card"
        className="border-l-4 border-primary hover:shadow-lg transition-all duration-200"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-heading font-bold text-primary group-hover:text-primary/80 transition-colors">
                {club.name}
              </h2>
              <div className="mt-1">
                <LocationInline address={t('location')} className="text-sm" />
              </div>
            </div>
          </div>

          {/* Event count badge */}
          <div className="flex items-center gap-1 px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm font-medium">
            <Calendar className="h-3 w-3" />
            {eventCount}
          </div>
        </div>

        {/* Description - truncated */}
        {club.description && (
          <p className="text-text-secondary font-body text-sm mb-4 line-clamp-2 leading-relaxed">
            {club.description}
          </p>
        )}

        {/* Upcoming Events - Clean layout */}
        <div className="space-y-3 mb-4">
          {upcomingEvents.slice(0, MAX_EVENTS_TO_DISPLAY).map((event) => (
            <div
              key={event.id}
              className="p-3 bg-surface-variant rounded-xl border border-border hover:border-primary/20 transition-colors"
            >
              <div className="flex items-start gap-2 mb-2">
                <div className="flex gap-2 flex-1 min-w-0">
                  <MapPin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <p className="font-body font-medium text-text-primary line-clamp-2 leading-tight">
                    {event.title}
                  </p>
                </div>
                <div className="flex-shrink-0 self-start">
                  <Tag variant="time" icon={Clock} size="xs">
                    {event.time}
                  </Tag>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap ml-6">
                <Tag variant="date" size="xs">
                  {formatEventDateFr(event.date, 'abbreviated')}
                </Tag>
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
            </div>
          ))}

          {eventCount > MAX_EVENTS_TO_DISPLAY && (
            <div className="flex items-center justify-center p-3 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl border border-dashed border-primary/20">
              <p className="text-sm text-text-secondary font-body text-center">
                {t('moreEvents', { count: eventCount - MAX_EVENTS_TO_DISPLAY })}
              </p>
            </div>
          )}
        </div>

        {/* Footer with action button */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-1 text-xs text-text-secondary font-body">
            <Calendar className="h-3 w-3" />
            <span>{t('upcomingEvents', { count: eventCount })}</span>
          </div>
          <div className="text-sm text-primary group-hover:text-primary/80 font-medium font-body">
            {t('viewClub')}
          </div>
        </div>
      </Card>
    </Link>
  )
}
