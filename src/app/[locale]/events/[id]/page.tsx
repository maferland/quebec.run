import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getEventById } from '@/lib/services/events'
import { Link } from '@/components/ui/link'
import { Card } from '@/components/ui/card'
import { Tag } from '@/components/ui/tag'
import { PageContainer } from '@/components/ui/page-container'
import { Icon } from '@/components/ui/icon'
import { formatEventDateFr } from '@/lib/utils/date-formatting'
import type { PageProps } from '@/lib/types/next'
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  ArrowLeft,
  Route,
  Gauge,
} from 'lucide-react'

export type EventPageProps = PageProps<{ id: string }>

export default async function EventPage({ params }: EventPageProps) {
  const { id } = await params
  const t = await getTranslations('events')
  const event = await getEventById({ data: { id } })

  if (!event) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-surface-variant">
      <PageContainer>
        {/* Back Navigation */}
        <div className="mb-8">
          <Link
            href="/events"
            className="text-sm text-text-secondary hover:text-text-primary flex items-center gap-2 transition-colors"
          >
            <Icon icon={ArrowLeft} size="sm" decorative />
            {t('backToEvents')}
          </Link>
        </div>

        {/* Event Header */}
        <Card className="mb-8 overflow-hidden">
          <div className="bg-gradient-to-br from-secondary/5 via-secondary/10 to-primary/5 p-8">
            <div className="max-w-4xl">
              {/* Event Title & Club */}
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-secondary/10 rounded-lg">
                  <Icon
                    icon={Calendar}
                    size="xl"
                    color="secondary"
                    decorative
                  />
                </div>
                <div className="flex-1">
                  <h1 className="text-4xl font-heading font-bold text-secondary mb-3">
                    {event.title}
                  </h1>
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
                <p className="text-lg text-text-primary font-body leading-relaxed mb-6 max-w-3xl">
                  {event.description}
                </p>
              )}

              {/* Event Details */}
              <div className="flex items-center gap-3 flex-wrap mb-6">
                <Tag variant="datetime" icon={Calendar}>
                  {formatEventDateFr(event.date, 'full')}
                </Tag>
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

              {/* Location */}
              {event.address && (
                <div className="bg-surface border border-border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Icon icon={MapPin} size="md" color="primary" decorative />
                    <div>
                      <h3 className="font-heading font-semibold text-text-primary mb-1">
                        {t('details.meetingLocation')}
                      </h3>
                      <p className="text-text-secondary font-body">
                        {event.address}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Additional Information */}
        <Card>
          <div className="p-8">
            <div className="flex items-center gap-3 mb-8">
              <Icon icon={Clock} size="lg" color="primary" decorative />
              <h2 className="text-2xl font-heading font-bold text-primary">
                {t('details.title')}
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Event Info */}
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon
                      icon={Calendar}
                      size="sm"
                      color="text-secondary"
                      decorative
                    />
                    <h3 className="font-heading font-semibold text-text-primary">
                      {t('details.when')}
                    </h3>
                  </div>
                  <p className="text-text-secondary font-body">
                    {formatEventDateFr(event.date, 'full')} at {event.time}
                  </p>
                </div>

                {event.distance && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon
                        icon={Route}
                        size="sm"
                        color="text-secondary"
                        decorative
                      />
                      <h3 className="font-heading font-semibold text-text-primary">
                        {t('details.distance')}
                      </h3>
                    </div>
                    <p className="text-text-secondary font-body">
                      {event.distance}
                    </p>
                  </div>
                )}

                {event.pace && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon
                        icon={Gauge}
                        size="sm"
                        color="text-secondary"
                        decorative
                      />
                      <h3 className="font-heading font-semibold text-text-primary">
                        {t('details.pace')}
                      </h3>
                    </div>
                    <p className="text-text-secondary font-body">
                      {event.pace}
                    </p>
                  </div>
                )}
              </div>

              {/* Club Info */}
              {event.club && (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon
                        icon={Users}
                        size="sm"
                        color="text-secondary"
                        decorative
                      />
                      <h3 className="font-heading font-semibold text-text-primary">
                        {t('details.organizedBy')}
                      </h3>
                    </div>
                    <Link
                      href={`/clubs/${event.club.slug}`}
                      className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-body font-medium transition-colors"
                    >
                      {event.club.name}
                      <Icon
                        icon={ArrowLeft}
                        size="sm"
                        className="rotate-180"
                        decorative
                      />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </PageContainer>
    </div>
  )
}
