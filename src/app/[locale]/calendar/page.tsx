import { getTranslations, getLocale } from 'next-intl/server'
import { Card } from '@/components/ui/card'
import { Tag } from '@/components/ui/tag'
import { Link } from '@/components/ui/link'
import { PageContainer } from '@/components/ui/page-container'
import { EmptyState } from '@/components/ui/empty-state'
import { Icon } from '@/components/ui/icon'
import { EventFilters } from '@/components/events/event-filters'
import { groupEventsByDate } from '@/lib/utils/date-formatting'
import { getCalendarListing } from '@/lib/services/events'
import { eventUrl } from '@/lib/utils/event-url'
import { Calendar, Clock, MapPin, Users, Route, Gauge } from 'lucide-react'

export const dynamic = 'force-dynamic'

type SearchParams = Record<string, string | string[] | undefined>

function firstString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const t = await getTranslations('calendar')
  const locale = await getLocale()
  const params = await searchParams
  const query = {
    limit: 200,
    offset: 0,
    pacePolicy: firstString(params.pacePolicy) as
      | 'OPEN_PACE'
      | 'SHARED'
      | undefined,
    timeOfDay: firstString(params.timeOfDay) as
      | 'morning'
      | 'evening'
      | undefined,
    weekend: firstString(params.weekend) as '1' | undefined,
    clubVibe: firstString(params.clubVibe) as 'SOCIAL' | 'TRAINING' | undefined,
    beginner: firstString(params.beginner) as '1' | undefined,
    showPast: firstString(params.showPast) as '1' | undefined,
  }

  const { events, facetCounts } = await getCalendarListing({ data: query })

  const groupedEvents = groupEventsByDate(events, {
    locale: locale === 'fr' ? 'fr-CA' : 'en-US',
  })

  // Sort each day's events by start time ascending so today's morning runs
  // appear above evening ones.
  for (const date of Object.keys(groupedEvents)) {
    groupedEvents[date].sort((a, b) => a.time.localeCompare(b.time))
  }

  const now = new Date()

  const eventStart = (event: { date: Date; time: string }): Date => {
    const [h, m] = event.time.split(':').map(Number)
    const d = new Date(event.date)
    d.setHours(h || 0, m || 0, 0, 0)
    return d
  }

  return (
    <div className="min-h-screen bg-surface-variant">
      <PageContainer>
        {/* Calendar Header */}
        <Card className="mb-8 overflow-hidden rounded-2xl">
          <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-secondary/5 p-4 md:p-6 rounded-2xl">
            <div className="text-center max-w-4xl mx-auto">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Icon icon={Calendar} size="xl" color="primary" decorative />
                </div>
                <h1 className="text-2xl md:text-4xl font-heading font-bold text-primary">
                  {t('title')}
                </h1>
              </div>
              <p className="text-lg text-text-primary font-body leading-relaxed max-w-3xl mx-auto">
                {t('description')}
              </p>
            </div>
          </div>
        </Card>

        <EventFilters facetCounts={facetCounts} hideCountsWhenInactive />

        {/* Events Content */}
        {Object.keys(groupedEvents).length === 0 ? (
          <EmptyState
            icon={Calendar}
            title={t('empty.title')}
            description={t('empty.description')}
          />
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedEvents).map(([date, dayEvents]) => (
              <Card key={date}>
                <div className="p-3 md:p-5">
                  {/* Date Header */}
                  <div className="flex items-center gap-3 mb-3 pb-2 border-b border-border">
                    <Icon
                      icon={Calendar}
                      size="lg"
                      color="primary"
                      decorative
                    />
                    <h2 className="text-2xl font-heading font-bold text-primary">
                      {date}
                    </h2>
                  </div>

                  {/* Day Events */}
                  <div className="space-y-3">
                    {dayEvents.map((event) => {
                      const isPast = eventStart(event) < now
                      return (
                        <Link
                          key={event.id}
                          href={eventUrl(event)}
                          className="block no-underline hover:no-underline bg-surface border border-border rounded-lg p-3 md:p-4 transition-all duration-200 hover:-translate-y-1 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
                        >
                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                            {/* Event Info */}
                            <div className="flex-1">
                              <div className="flex items-start gap-3 mb-4">
                                <div className="p-2 bg-secondary/10 rounded-lg">
                                  <Icon
                                    icon={Clock}
                                    size="md"
                                    color="secondary"
                                    decorative
                                  />
                                </div>
                                <div className="flex-1">
                                  <h3
                                    className={`text-xl font-heading font-bold mb-2 ${isPast ? 'text-text-secondary line-through decoration-2 decoration-text-secondary/70' : 'text-text-primary'}`}
                                  >
                                    {event.title}
                                  </h3>
                                  {event.club && (
                                    <Tag variant="outline" icon={Users}>
                                      {event.club.name}
                                    </Tag>
                                  )}
                                </div>
                              </div>

                              {/* Description */}
                              {event.description && (
                                <p className="text-text-secondary font-body mb-4 max-w-2xl">
                                  {event.description}
                                </p>
                              )}

                              {/* Event Details */}
                              <div className="flex items-center gap-3 flex-wrap">
                                <Tag
                                  variant={isPast ? 'outline' : 'time'}
                                  icon={Clock}
                                  className={
                                    isPast
                                      ? 'line-through decoration-text-secondary/70'
                                      : ''
                                  }
                                >
                                  {event.time}
                                </Tag>
                                {event.distance && (
                                  <Tag variant="distance" icon={Route}>
                                    {event.distance}
                                  </Tag>
                                )}
                                {event.pace && (
                                  <Tag variant="pace" icon={Gauge}>
                                    {event.pace}
                                  </Tag>
                                )}
                              </div>
                            </div>

                            {/* Location */}
                            {event.address && (
                              <div className="bg-surface-variant border border-border rounded-lg p-4 lg:w-80">
                                <div className="flex items-start gap-3">
                                  <Icon
                                    icon={MapPin}
                                    size="sm"
                                    color="primary"
                                    decorative
                                  />
                                  <div>
                                    <h4 className="font-heading font-semibold text-text-primary mb-1 text-sm">
                                      {t('meetingLocation')}
                                    </h4>
                                    <p className="text-text-secondary font-body text-sm">
                                      {event.address}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </PageContainer>
    </div>
  )
}
