import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import {
  getEventByClubAndSlug,
  getTorontoDayBounds,
} from '@/lib/services/events'
import { getPlacePage } from '@/lib/services/recurring-events'
import { buildPageMetadata, SITE_URL, type Locale } from '@/lib/seo/metadata'
import { JsonLd, breadcrumbList, eventJsonLd } from '@/components/seo/json-ld'
import { getClubBySlug } from '@/lib/services/clubs'
import { Link } from '@/components/ui/link'
import { Card } from '@/components/ui/card'
import { Tag } from '@/components/ui/tag'
import { ContentGrid } from '@/components/ui/content-grid'
import { PageContainer } from '@/components/ui/page-container'
import { Icon } from '@/components/ui/icon'
import { EventMap } from '@/components/map/event-map'
import { RecurringPatternCard } from '@/components/clubs/recurring-pattern-card'
import { formatEventDate } from '@/lib/utils/date-formatting'
import type { PageProps } from '@/lib/types/next'
import { MapPin, Route, Gauge, ChevronRight, UserCheck } from 'lucide-react'

export type ClubEventDatePageProps = PageProps<{
  locale: string
  slug: string
  eventSlug: string
  date: string
}>

export const revalidate = 900

const ADDRESS_TOKEN =
  /\b\d+\s+(rue|bd|boulevard|av|avenue|street|st|ch|chemin|route|rang)\b\.?/i

const cleanDescription = (description: string | null): string => {
  if (!description) return ''
  // Split only on em-dash (—). En-dash (–) is used for ranges like "Nov–Mar".
  const parts = description.split(/\s*—\s*/)
  const venueParts = parts.filter((p) => !ADDRESS_TOKEN.test(p))
  if (venueParts.length === 0) return ''
  const cleaned = venueParts.join(' — ').trim()
  return cleaned.replace(ADDRESS_TOKEN, '').replace(/^[\s,]+|[\s,]+$/g, '')
}

const proseFromDescription = (description: string | null): string => {
  const cleaned = cleanDescription(description)
  if (!cleaned) return ''
  if (cleaned.length >= 25 || /[.!?]/.test(cleaned)) return cleaned
  return ''
}

const capitalize = (s: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1) : s

export async function generateMetadata({
  params,
}: ClubEventDatePageProps): Promise<Metadata> {
  const { locale, slug, eventSlug, date } = await params
  const event = await getEventByClubAndSlug({
    data: { clubSlug: slug, eventSlug, date },
  }).catch(() => null)
  const t = await getTranslations({
    locale,
    namespace: 'metadata.eventDetail',
  })
  const path = `/clubs/${slug}/events/${eventSlug}/${date}`
  if (!event || !event.club) {
    return buildPageMetadata({
      locale: locale as Locale,
      path,
      title: t('title', { eventTitle: eventSlug, clubName: slug }),
      description: t('description', {
        eventTitle: eventSlug,
        clubName: slug,
      }),
      noIndex: true,
    })
  }
  // One occurrence of a weekly run is not its own destination: the place page
  // carries the ranking, this URL stays reachable for anyone holding the link.
  const place = await getPlacePage({ clubSlug: slug, placeSlug: eventSlug })
    .catch(() => null)
    .then((resolved) => resolved?.primarySlug ?? eventSlug)

  return buildPageMetadata({
    locale: locale as Locale,
    path,
    canonicalPath: `/clubs/${slug}/events/${place}`,
    noIndex: true,
    noFollow: false,
    title: t('title', {
      eventTitle: event.title,
      clubName: event.club.name,
    }),
    description:
      event.description?.slice(0, 160) ??
      t('description', {
        eventTitle: event.title,
        clubName: event.club.name,
      }),
    ogType: 'article',
  })
}

export default async function ClubEventDatePage({
  params,
}: ClubEventDatePageProps) {
  const { locale, slug, eventSlug, date } = await params

  // A date that has come and gone has nothing to offer a visitor arriving from
  // search; the place page tells them when the next one is.
  if (new Date(`${date}T23:59:59`) < getTorontoDayBounds(0).start) {
    permanentRedirect(`/${locale}/clubs/${slug}/events/${eventSlug}`)
  }

  const t = await getTranslations('events')
  const [event, club] = await Promise.all([
    getEventByClubAndSlug({ data: { clubSlug: slug, eventSlug, date } }).catch(
      () => null
    ),
    getClubBySlug({ slug }).catch(() => null),
  ])

  if (!event) {
    notFound()
  }

  const cleanedDescription = cleanDescription(event.description)
  const prose = proseFromDescription(event.description)
  const venueIsProse = cleanedDescription === prose
  const venueHeading = venueIsProse
    ? t('details.meetingLocation')
    : cleanedDescription || t('details.meetingLocation')
  const dateLocale = locale === 'fr' ? 'fr-CA' : 'en-CA'
  const formattedDate = capitalize(
    formatEventDate(event.date, 'full', { locale: dateLocale })
  )
  const titleIsClubName = event.title === event.club?.name
  const breadcrumbTail = titleIsClubName
    ? capitalize(
        formatEventDate(event.date, 'abbreviated', { locale: dateLocale })
      )
    : event.title

  const hasCoords = event.latitude !== null && event.longitude !== null
  const otherPatterns = club?.patterns.filter((p) => p.slug !== eventSlug) ?? []

  const pageUrl = `${SITE_URL}/${locale}/clubs/${slug}/events/${eventSlug}/${date}`
  const clubUrl = `${SITE_URL}/${locale}/clubs/${slug}`

  return (
    <div className="min-h-screen bg-surface-variant">
      {event.club && (
        <JsonLd
          data={[
            eventJsonLd({
              locale: locale as 'fr' | 'en',
              url: pageUrl,
              title: event.title,
              description: event.description,
              startDate: event.date,
              startTime: event.time,
              address: event.address,
              latitude: event.latitude,
              longitude: event.longitude,
              clubName: event.club.name,
              clubUrl,
              status: event.status,
            }),
            breadcrumbList([
              {
                name: t('breadcrumb.clubs'),
                url: `${SITE_URL}/${locale}/clubs`,
              },
              { name: event.club.name, url: clubUrl },
              { name: event.title, url: pageUrl },
            ]),
          ]}
        />
      )}
      <PageContainer>
        <nav aria-label={t('breadcrumb.label')} className="mb-4 text-sm">
          <ol className="flex flex-wrap items-center gap-1.5 text-text-secondary">
            <li>
              <Link
                href={`/clubs/${slug}`}
                className="hover:text-text-primary transition-colors"
              >
                {event.club!.name}
              </Link>
            </li>
            <li aria-hidden="true" className="text-text-secondary/60">
              <Icon icon={ChevronRight} size="sm" decorative />
            </li>
            <li className="text-text-primary font-medium" aria-current="page">
              {breadcrumbTail}
            </li>
          </ol>
        </nav>

        <header className="mb-4">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-text-primary mb-1">
            {event.title}
          </h1>
          <p className="text-base md:text-lg text-text-secondary font-body">
            {formattedDate} · {event.time}
          </p>
        </header>

        {prose && (
          <p className="mb-4 text-sm text-text-secondary font-body leading-relaxed max-w-2xl">
            {prose}
          </p>
        )}

        <Card className="mb-8 p-5 md:p-6 rounded-2xl">
          {event.address && (
            <div className="flex items-start gap-3">
              <Icon icon={MapPin} size="md" color="primary" decorative />
              <div>
                <h2 className="font-heading font-semibold text-text-primary mb-0.5">
                  {venueHeading}
                </h2>
                <p className="text-text-secondary font-body">{event.address}</p>
              </div>
            </div>
          )}

          {hasCoords && (
            <div className="mt-5">
              <EventMap
                height="sm"
                events={[
                  {
                    id: event.id,
                    title: event.title,
                    date: event.date,
                    time: event.time,
                    address: event.address,
                    latitude: event.latitude,
                    longitude: event.longitude,
                    club: event.club,
                  },
                ]}
                initialCenter={[event.latitude!, event.longitude!]}
                initialZoom={15}
              />
            </div>
          )}

          {(event.distance ||
            event.pace ||
            event.pacePolicy === 'OPEN_PACE') && (
            <div className="mt-5 flex items-center gap-2 flex-wrap">
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
              {/* SHARED is the default assumption — pace value itself carries
                  the signal. Only INCLUSIVE is worth a badge. */}
              {event.pacePolicy === 'OPEN_PACE' && (
                <span title={t('pacePolicy.openPaceHint')}>
                  <Tag colorScheme="success" icon={UserCheck}>
                    {t('pacePolicy.openPace')}
                  </Tag>
                </span>
              )}
            </div>
          )}
        </Card>

        {otherPatterns.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl md:text-2xl font-heading font-bold text-text-primary mb-4">
              {t('moreFromClub', { name: event.club!.name })}
            </h2>
            <ContentGrid columns="auto" gap="md">
              {otherPatterns.map((pattern) => (
                <RecurringPatternCard
                  key={pattern.id}
                  pattern={pattern}
                  clubSlug={slug}
                  clubName={event.club!.name}
                />
              ))}
            </ContentGrid>
          </section>
        )}

        {club?.description && (
          <Link
            href={`/clubs/${slug}`}
            className="block no-underline hover:no-underline mb-8"
          >
            <Card variant="interactive" className="p-5 md:p-6 rounded-2xl">
              <h2 className="font-heading font-semibold text-text-primary mb-1">
                {t('aboutClub', { name: event.club!.name })}
              </h2>
              <p className="text-sm text-text-secondary line-clamp-2 mb-2">
                {club.description}
              </p>
              <span className="text-sm text-primary font-medium inline-flex items-center gap-1">
                {t('viewClub')}
                <Icon icon={ChevronRight} size="sm" decorative />
              </span>
            </Card>
          </Link>
        )}
      </PageContainer>
    </div>
  )
}
