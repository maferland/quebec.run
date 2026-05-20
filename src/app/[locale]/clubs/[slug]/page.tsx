import { getTranslations } from 'next-intl/server'
import { RecurringPatternCard } from '@/components/clubs/recurring-pattern-card'
import { ContentGrid } from '@/components/ui/content-grid'
import { Link } from '@/components/ui/link'
import { Card } from '@/components/ui/card'
import { PageContainer } from '@/components/ui/page-container'
import { EmptyState } from '@/components/ui/empty-state'
import { Icon } from '@/components/ui/icon'
import { Tag } from '@/components/ui/tag'
import { getClubBySlug } from '@/lib/services/clubs'
import type { PageProps } from '@/lib/types/next'
import {
  Calendar,
  ChevronRight,
  Globe,
  Instagram,
  Facebook,
  Users,
  ExternalLink,
} from 'lucide-react'
import { notFound } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'

const withHttps = (url: string) =>
  url.startsWith('http') ? url : `https://${url}`

function SocialTag({
  href,
  icon,
  children,
}: {
  href: string
  icon: LucideIcon
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="no-underline hover:no-underline transition-opacity hover:opacity-80"
    >
      <Tag colorScheme="primary" icon={icon}>
        <span className="inline-flex items-center gap-1">
          {children}
          <ExternalLink className="h-3 w-3 opacity-70" />
        </span>
      </Tag>
    </a>
  )
}

export type ClubPageProps = PageProps<{ slug: string }>

export default async function ClubPage({ params }: ClubPageProps) {
  const t = await getTranslations('clubs')
  const tEvents = await getTranslations('events')
  const club = await getClubBySlug(await params)

  if (!club) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-surface-variant">
      <PageContainer>
        <nav aria-label={tEvents('breadcrumb.label')} className="mb-4 text-sm">
          <ol className="flex flex-wrap items-center gap-1.5 text-text-secondary">
            <li>
              <Link
                href="/clubs"
                className="hover:text-text-primary transition-colors"
              >
                {tEvents('breadcrumb.clubs')}
              </Link>
            </li>
            <li aria-hidden="true" className="text-text-secondary/60">
              <Icon icon={ChevronRight} size="sm" decorative />
            </li>
            <li className="text-text-primary font-medium" aria-current="page">
              {club.name}
            </li>
          </ol>
        </nav>

        {/* Club Header */}
        <Card className="mb-8 overflow-hidden">
          <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-secondary/5 p-4 md:p-8">
            <div className="max-w-4xl">
              {/* Club Name & Location */}
              <div className="flex items-start gap-3 md:gap-4 mb-6">
                <div className="p-2 md:p-3 bg-primary/10 rounded-xl">
                  <Icon icon={Users} size="md" color="primary" decorative />
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl md:text-4xl font-heading font-bold text-primary mb-2">
                    {club.name}
                  </h1>
                </div>
              </div>

              {/* Description */}
              {club.description && (
                <p className="text-base md:text-lg text-text-primary font-body leading-relaxed mb-6 max-w-3xl line-clamp-5">
                  {club.description}
                </p>
              )}

              {/* Social Links & Stats */}
              <div className="flex items-center gap-2 flex-wrap">
                {club.website && (
                  <SocialTag href={withHttps(club.website)} icon={Globe}>
                    Website
                  </SocialTag>
                )}
                {club.instagram && (
                  <SocialTag
                    href={`https://instagram.com/${club.instagram}`}
                    icon={Instagram}
                  >
                    @{club.instagram}
                  </SocialTag>
                )}
                {club.facebook && (
                  <SocialTag
                    href={withHttps(
                      club.facebook.includes('facebook.com')
                        ? club.facebook
                        : `facebook.com/${club.facebook}`
                    )}
                    icon={Facebook}
                  >
                    Facebook
                  </SocialTag>
                )}
                {club.patterns.length > 0 && (
                  <Tag colorScheme="gray" icon={Calendar}>
                    {t('card.recurringEvents', {
                      count: club.patterns.length,
                    })}
                  </Tag>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Events Section */}
        <Card>
          <div className="p-5 md:p-8">
            <div className="flex items-center gap-3 mb-8">
              <Icon icon={Calendar} size="lg" color="primary" decorative />
              <h2 className="text-xl md:text-2xl font-heading font-bold text-primary">
                {t('card.upcomingEventsTitle')}
              </h2>
            </div>

            {club.patterns.length > 0 ? (
              <ContentGrid columns="2" gap="lg">
                {club.patterns.map((pattern) => (
                  <RecurringPatternCard
                    key={pattern.id}
                    pattern={pattern}
                    clubSlug={club.slug}
                    clubName={club.name}
                  />
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
