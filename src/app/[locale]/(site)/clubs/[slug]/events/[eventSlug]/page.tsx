import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getPlacePage, type PlacePage } from '@/lib/services/recurring-events'
import { buildPageMetadata, SITE_URL, type Locale } from '@/lib/seo/metadata'
import { JsonLd, breadcrumbList, placeJsonLd } from '@/components/seo/json-ld'
import { Link } from '@/components/ui/link'
import { Card } from '@/components/ui/card'
import { Tag } from '@/components/ui/tag'
import { PageContainer } from '@/components/ui/page-container'
import { Icon } from '@/components/ui/icon'
import { EventMap } from '@/components/map/event-map'
import { describePattern } from '@/lib/utils/rrule-builder'
import { formatEventDate } from '@/lib/utils/date-formatting'
import type { PageProps } from '@/lib/types/next'
import { format } from 'date-fns'
import { MapPin, Route, Gauge, ChevronRight, UserCheck } from 'lucide-react'

export type ClubPlacePageProps = PageProps<{
  locale: string
  slug: string
  eventSlug: string
}>

export const revalidate = 900

const OTHER_PLACES_SHOWN = 6
const UPCOMING_SHOWN = 6

const capitalize = (s: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1) : s

const titleCase = (value: string) => value.split('-').map(capitalize).join(' ')

const placePath = (clubSlug: string, placeSlug: string) =>
  `/clubs/${clubSlug}/events/${placeSlug}`

// Pattern titles carry the club name ("6AM Club Limoilou"); a list of them
// repeats it once per link, which is the keyword noise this page is trimming.
const placeLabel = (
  place: { title: string; neighborhood: string | null },
  clubName: string
) =>
  place.neighborhood ??
  (place.title.startsWith(clubName)
    ? place.title.slice(clubName.length).trim() || place.title
    : place.title)

function schedules(place: PlacePage, locale: Locale): string[] {
  return place.slots.flatMap((slot) => {
    const described = describePattern(slot.schedulePattern, locale)
    return described ? [described] : []
  })
}

export async function generateMetadata({
  params,
}: ClubPlacePageProps): Promise<Metadata> {
  const { locale, slug, eventSlug } = await params
  const place = await getPlacePage({
    clubSlug: slug,
    placeSlug: eventSlug,
  }).catch(() => null)
  const t = await getTranslations({ locale, namespace: 'metadata.place' })
  const path = placePath(slug, eventSlug)

  if (!place) {
    return buildPageMetadata({
      locale: locale as Locale,
      path,
      title: eventSlug,
      description: '',
      noIndex: true,
    })
  }

  const title = place.slots[0]?.title ?? place.club.name
  const lines = schedules(place, locale as Locale)
  // Search results cut titles around 60 characters and descriptions around 155,
  // so a place with several weekly slots names one in the title and two here.
  const schedule = lines.slice(0, 2).join(' · ')

  return buildPageMetadata({
    locale: locale as Locale,
    path,
    canonicalPath: placePath(slug, place.primarySlug),
    title: t('title', { eventTitle: title, schedule: lines[0] ?? '' }),
    description: place.place.address
      ? t('description', {
          schedule,
          address: place.place.address,
          clubName: place.club.name,
        })
      : t('descriptionNoAddress', { schedule, clubName: place.club.name }),
    ogType: 'article',
  })
}

export default async function ClubPlacePage({ params }: ClubPlacePageProps) {
  const { locale, slug, eventSlug } = await params
  const place = await getPlacePage({ clubSlug: slug, placeSlug: eventSlug })
  if (!place) notFound()

  // Every slug at a place resolves, but only the primary one is canonical.
  if (place.primarySlug !== eventSlug) {
    permanentRedirect(`/${locale}${placePath(slug, place.primarySlug)}`)
  }

  const t = await getTranslations('events')
  const dateLocale = locale === 'fr' ? 'fr-CA' : 'en-CA'
  const heading = place.slots[0]?.title ?? place.club.name
  const pageUrl = `${SITE_URL}/${locale}${placePath(slug, eventSlug)}`
  const clubUrl = `${SITE_URL}/${locale}/clubs/${slug}`
  const hasCoords =
    place.place.latitude !== null && place.place.longitude !== null
  const hasTags = place.slots.some(
    (slot) => slot.distance || slot.pace || slot.pacePolicy === 'OPEN_PACE'
  )
  // A pattern titled after its club would repeat it in the breadcrumb.
  const breadcrumbTail =
    place.place.neighborhood ??
    (heading === place.club.name ? titleCase(eventSlug) : heading)
  const upcoming = place.slots
    .flatMap((slot) =>
      slot.occurrences.map((date) => ({ date, slug: slot.slug }))
    )
    .sort((first, second) => first.date.getTime() - second.date.getTime())
    .slice(0, UPCOMING_SHOWN)

  return (
    <div className="min-h-screen bg-surface-variant">
      <JsonLd
        data={[
          ...place.slots.map((slot) =>
            placeJsonLd({
              locale: locale as 'fr' | 'en',
              url: pageUrl,
              title: slot.title,
              description: slot.description,
              schedulePattern: slot.schedulePattern,
              nextOccurrence: slot.occurrences[0] ?? null,
              address: slot.address,
              latitude: slot.latitude,
              longitude: slot.longitude,
              clubName: place.club.name,
              clubUrl,
            })
          ),
          breadcrumbList([
            { name: t('breadcrumb.clubs'), url: `${SITE_URL}/${locale}/clubs` },
            { name: place.club.name, url: clubUrl },
            { name: heading, url: pageUrl },
          ]),
        ]}
      />
      <PageContainer>
        <nav aria-label={t('breadcrumb.label')} className="mb-4 text-sm">
          <ol className="flex flex-wrap items-center gap-1.5 text-text-secondary">
            <li>
              <Link
                href={`/clubs/${slug}`}
                className="hover:text-text-primary transition-colors"
              >
                {place.club.name}
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
            {heading}
          </h1>
          <p className="text-base md:text-lg text-text-secondary font-body">
            {schedules(place, locale as Locale).join(' · ')}
          </p>
        </header>

        <Card className="mb-8 p-5 md:p-6 rounded-2xl">
          {place.place.address && (
            <div className="flex items-start gap-3">
              <Icon icon={MapPin} size="md" color="primary" decorative />
              <div>
                <h2 className="font-heading font-semibold text-text-primary mb-0.5">
                  {t('details.meetingLocation')}
                </h2>
                <p className="text-text-secondary font-body">
                  {place.place.address}
                </p>
                {place.place.neighborhood && (
                  <p className="text-sm text-text-secondary/80 font-body">
                    {place.place.neighborhood}
                  </p>
                )}
              </div>
            </div>
          )}

          {hasCoords && (
            <div className="mt-5">
              <EventMap
                height="sm"
                events={place.slots.map((slot) => ({
                  id: slot.id,
                  title: slot.title,
                  date: slot.occurrences[0] ?? new Date(),
                  time: format(slot.occurrences[0] ?? new Date(), 'HH:mm'),
                  address: slot.address,
                  latitude: slot.latitude,
                  longitude: slot.longitude,
                  club: { id: place.club.id, name: place.club.name, slug },
                }))}
                initialCenter={[place.place.latitude!, place.place.longitude!]}
                initialZoom={15}
              />
            </div>
          )}

          {hasTags && (
            <div className="mt-5 flex items-center gap-2 flex-wrap">
              {place.slots.map((slot) => (
                <span key={`tags-${slot.id}`} className="flex gap-2">
                  {slot.distance && (
                    <Tag variant="distance" icon={Route}>
                      {slot.distance}
                    </Tag>
                  )}
                  {slot.pace && (
                    <Tag variant="pace" icon={Gauge}>
                      {slot.pace}
                    </Tag>
                  )}
                  {slot.pacePolicy === 'OPEN_PACE' && (
                    <span title={t('pacePolicy.openPaceHint')}>
                      <Tag colorScheme="success" icon={UserCheck}>
                        {t('pacePolicy.openPace')}
                      </Tag>
                    </span>
                  )}
                </span>
              ))}
            </div>
          )}
        </Card>

        {upcoming.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl md:text-2xl font-heading font-bold text-text-primary mb-4">
              {t('place.upcoming')}
            </h2>
            <ul className="flex flex-wrap gap-2">
              {upcoming.map((occurrence) => (
                <li key={`${occurrence.slug}-${occurrence.date.toISOString()}`}>
                  <Link
                    href={`/run/${slug}-${occurrence.slug}--${format(occurrence.date, 'yyyy-MM-dd')}`}
                    className="inline-flex rounded-full border border-border px-3 py-1.5 text-sm no-underline"
                  >
                    {capitalize(
                      formatEventDate(occurrence.date, 'abbreviated', {
                        locale: dateLocale,
                      })
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {place.otherPlaces.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl md:text-2xl font-heading font-bold text-text-primary mb-3">
              {t('place.otherPlaces', { name: place.club.name })}
            </h2>
            <ul className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
              {place.otherPlaces.slice(0, OTHER_PLACES_SHOWN).map((other) => (
                <li key={other.slug}>
                  <Link href={placePath(slug, other.slug)}>
                    {placeLabel(other, place.club.name)}
                  </Link>
                </li>
              ))}
              {place.otherPlaces.length > OTHER_PLACES_SHOWN && (
                <li>
                  <Link href={`/clubs/${slug}`}>{t('place.seeAllPlaces')}</Link>
                </li>
              )}
            </ul>
          </section>
        )}

        {place.club.description && (
          <Link
            href={`/clubs/${slug}`}
            className="block no-underline hover:no-underline mb-8"
          >
            <Card variant="interactive" className="p-5 md:p-6 rounded-2xl">
              <h2 className="font-heading font-semibold text-text-primary mb-1">
                {t('aboutClub', { name: place.club.name })}
              </h2>
              <p className="text-sm text-text-secondary line-clamp-2 mb-2">
                {place.club.description}
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
