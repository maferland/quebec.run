'use client'

import { useUpcomingEvents } from '@/lib/hooks/use-events'
import { Card } from '@/components/ui/card'
import { Tag } from '@/components/ui/tag'
import { Link } from '@/components/ui/link'
import { PageContainer } from '@/components/ui/page-container'
import { EmptyState } from '@/components/ui/empty-state'
import { Icon } from '@/components/ui/icon'
import { dateUtils } from '@/lib/utils/date-formatting'
import { Calendar, Clock, MapPin, Users, Route, Gauge } from 'lucide-react'

export default function CalendarPage() {
  const { data: events = [], isLoading } = useUpcomingEvents()

  const groupedEvents = events.reduce(
    (groups, event) => {
      const date = dateUtils.formatEventDate(event.date, 'yyyy-MM-dd')
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(event)
      return groups
    },
    {} as Record<string, typeof events>
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-variant">
        <PageContainer>
          <div className="text-center py-20">
            <Icon
              icon={Calendar}
              size="xl"
              color="primary"
              decorative
              className="mx-auto mb-4"
            />
            <p className="text-text-secondary text-lg font-body">
              Loading runs...
            </p>
          </div>
        </PageContainer>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-variant">
      <PageContainer>
        {/* Calendar Header */}
        <Card className="mb-8 overflow-hidden">
          <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-secondary/5 p-8">
            <div className="text-center max-w-4xl mx-auto">
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Icon icon={Calendar} size="xl" color="primary" decorative />
                </div>
                <h1 className="text-4xl font-heading font-bold text-primary">
                  Upcoming Runs Calendar
                </h1>
              </div>
              <p className="text-lg text-text-primary font-body leading-relaxed max-w-3xl mx-auto">
                Browse all scheduled runs and events from Quebec City run clubs.
              </p>
            </div>
          </div>
        </Card>

        {/* Events Content */}
        {Object.keys(groupedEvents).length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No upcoming runs scheduled"
            description="Check back soon for new running events in Quebec City"
          />
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedEvents).map(([date, dayEvents]) => (
              <Card key={date}>
                <div className="p-8">
                  {/* Date Header */}
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
                    <Icon
                      icon={Calendar}
                      size="lg"
                      color="primary"
                      decorative
                    />
                    <h2 className="text-2xl font-heading font-bold text-primary">
                      {dateUtils.formatHumanFriendlyDate(new Date(date))}
                    </h2>
                  </div>

                  {/* Day Events */}
                  <div className="space-y-6">
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        className="bg-surface border border-border rounded-lg p-6 hover:shadow-md transition-shadow"
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
                                <h3 className="text-xl font-heading font-bold text-text-primary mb-2">
                                  {event.title}
                                </h3>
                                {event.club && (
                                  <Link href={`/clubs/${event.club.slug}`}>
                                    <Tag variant="outline" icon={Users}>
                                      {event.club.name}
                                    </Tag>
                                  </Link>
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
                              <Tag variant="time" icon={Clock}>
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
                                    Meeting Location
                                  </h4>
                                  <p className="text-text-secondary font-body text-sm">
                                    {event.address}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
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
