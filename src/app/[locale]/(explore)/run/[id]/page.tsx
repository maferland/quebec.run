import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { buildPageMetadata, SITE_URL, type Locale } from '@/lib/seo/metadata'
import { getEventById } from '@/lib/services/events'
import { eventJsonLd, JsonLd } from '@/components/seo/json-ld'
import { notFound } from 'next/navigation'

export const revalidate = 900
export const dynamicParams = true

type Props = { params: Promise<{ locale: string; id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params
  const t = await getTranslations({ locale, namespace: 'metadata.eventDetail' })

  const event = await getEventById({ data: { id } }).catch(() => null)
  const title = event?.title ?? null
  const clubName = event?.club?.name ?? null
  const date = id.match(/--(\d{4}-\d{2}-\d{2})$/)?.[1]
  const recurringSlug =
    event && 'recurringSlug' in event ? event.recurringSlug : null
  const canonicalPath =
    date && recurringSlug && event?.club?.slug
      ? `/clubs/${event.club.slug}/events/${recurringSlug}/${date}`
      : `/run/${id}`

  return buildPageMetadata({
    locale: locale as Locale,
    path: canonicalPath,
    title:
      title && clubName
        ? t('title', { eventTitle: title, clubName })
        : 'quebec.run',
    description:
      title && clubName
        ? t('description', { eventTitle: title, clubName })
        : '',
    noIndex: !title,
  })
}

export default async function RunPage({ params }: Props) {
  const { locale, id } = await params
  const event = await getEventById({ data: { id } }).catch(() => null)
  if (!event?.club) notFound()

  const date = id.match(/--(\d{4}-\d{2}-\d{2})$/)?.[1]
  const recurringSlug = 'recurringSlug' in event ? event.recurringSlug : null
  const path =
    date && recurringSlug
      ? `/clubs/${event.club.slug}/events/${recurringSlug}/${date}`
      : `/run/${id}`

  return (
    <JsonLd
      data={eventJsonLd({
        locale: locale as Locale,
        url: `${SITE_URL}/${locale}${path}`,
        title: event.title,
        description: event.description,
        startDate: event.date,
        startTime: event.time,
        address: event.address,
        latitude: event.latitude,
        longitude: event.longitude,
        clubName: event.club.name,
        clubUrl: `${SITE_URL}/${locale}/clubs/${event.club.slug}`,
        status: event.status,
      })}
    />
  )
}
