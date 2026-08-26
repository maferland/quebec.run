import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getPlacePage, type PlacePage } from '@/lib/services/recurring-events'
import { buildPageMetadata, SITE_URL, type Locale } from '@/lib/seo/metadata'
import { JsonLd, breadcrumbList, placeJsonLd } from '@/components/seo/json-ld'
import { describePattern } from '@/lib/utils/rrule-builder'

// Next.js requires a literal here; keep in sync with PUBLIC_PAGE_REVALIDATE_SECONDS in public-cache.ts.
export const revalidate = 86400
export const dynamicParams = true

type Props = {
  params: Promise<{ locale: string; slug: string; place: string }>
}

const placePath = (clubSlug: string, placeSlug: string) =>
  `/clubs/${clubSlug}/events/${placeSlug}`

function schedules(place: PlacePage, locale: Locale): string[] {
  return place.slots.flatMap((slot) => {
    const described = describePattern(slot.schedulePattern, locale)
    return described ? [described] : []
  })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug, place: placeSlug } = await params
  const place = await getPlacePage({ clubSlug: slug, placeSlug }).catch(
    () => null
  )
  const t = await getTranslations({ locale, namespace: 'metadata.place' })
  const path = placePath(slug, placeSlug)

  if (!place) {
    return buildPageMetadata({
      locale: locale as Locale,
      path,
      title: placeSlug,
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

export default async function ClubPlaceRoute({ params }: Props) {
  const { locale, slug, place: placeSlug } = await params
  const place = await getPlacePage({ clubSlug: slug, placeSlug })
  if (!place) notFound()
  if (place.primarySlug !== placeSlug) {
    permanentRedirect(`/${locale}${placePath(slug, place.primarySlug)}`)
  }

  const t = await getTranslations('events')
  const heading = place.slots[0]?.title ?? place.club.name
  const pageUrl = `${SITE_URL}/${locale}${placePath(slug, placeSlug)}`
  const clubUrl = `${SITE_URL}/${locale}/clubs/${slug}`

  return (
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
  )
}
