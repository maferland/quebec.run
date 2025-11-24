import { getTranslations } from 'next-intl/server'
import { EventCard } from '@/components/events/event-card'
import { Link } from '@/components/ui/link'
import { Card } from '@/components/ui/card'
import { ContentGrid } from '@/components/ui/content-grid'
import { PageContainer } from '@/components/ui/page-container'
import { EmptyState } from '@/components/ui/empty-state'
import { Icon } from '@/components/ui/icon'
import { Tag } from '@/components/ui/tag'
import { getClubBySlug } from '@/lib/services/clubs'
import type { PageProps } from '@/lib/types/next'
import {
  Calendar,
  ArrowLeft,
  Globe,
  Instagram,
  Facebook,
  Users,
  MapPin,
} from 'lucide-react'
import { notFound } from 'next/navigation'

export type ClubPageProps = PageProps<{ slug: string }>

export default async function ClubPage({ params }: ClubPageProps) {
  const t = await getTranslations('clubs')
  const club = await getClubBySlug(await params)

  if (!club) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-surface-variant">
      <PageContainer>
        {/* Back Navigation */}
        <div className="mb-8">
          <Link
            href="/clubs"
            className="text-sm text-text-secondary hover:text-text-primary flex items-center gap-2 transition-colors"
          >
            <Icon icon={ArrowLeft} size="sm" decorative />
            {t('backToClubs')}
          </Link>
        </div>

        {/* Club Header */}
        <Card className="mb-8 overflow-hidden">
          <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-secondary/5 p-8">
            <div className="max-w-4xl">
              {/* Club Name & Location */}
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Icon icon={Users} size="xl" color="primary" decorative />
                </div>
                <div className="flex-1">
                  <h1 className="text-4xl font-heading font-bold text-primary mb-2">
                    {club.name}
                  </h1>
                  <div className="flex items-center gap-2">
                    <Icon
                      icon={MapPin}
                      size="sm"
                      color="text-secondary"
                      decorative
                    />
                    <span className="text-text-secondary font-body">
                      Quebec City
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {club.description && (
                <p className="text-lg text-text-primary font-body leading-relaxed mb-6 max-w-3xl">
                  {club.description}
                </p>
              )}

              {/* Social Links & Stats */}
              <div className="flex items-center gap-3 flex-wrap">
                {club.website && (
                  <Link href={club.website}>
                    <Tag variant="outline" icon={Globe}>
                      Website
                    </Tag>
                  </Link>
                )}
                {club.instagram && (
                  <Tag variant="outline" icon={Instagram}>
                    @{club.instagram}
                  </Tag>
                )}
                {club.facebook && (
                  <Tag variant="outline" icon={Facebook}>
                    Facebook
                  </Tag>
                )}
                {club.events && club.events.length > 0 && (
                  <Tag variant="primary" icon={Calendar}>
                    {club.events.length} upcoming events
                  </Tag>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Events Section */}
        <Card>
          <div className="p-8">
            <div className="flex items-center gap-3 mb-8">
              <Icon icon={Calendar} size="lg" color="primary" decorative />
              <h2 className="text-2xl font-heading font-bold text-primary">
                {t('card.upcomingEventsTitle')}
              </h2>
            </div>

            {club.events && club.events.length > 0 ? (
              <ContentGrid columns="2" gap="lg">
                {club.events.map((event) => (
                  <EventCard key={event.id} event={{ ...event, club }} />
                ))}
              </ContentGrid>
            ) : (
              <EmptyState
                icon={Calendar}
                title={t('noEvents.title')}
                description={t('noEvents.description')}
              />
            )}
          </div>
        </Card>
      </PageContainer>
    </div>
  )
}
