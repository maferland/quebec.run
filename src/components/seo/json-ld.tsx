import { SITE_NAME, SITE_URL } from '@/lib/seo/metadata'

export type JsonLdProps = {
  /** Schema.org object. Stringified + escaped at render time. */
  data: Record<string, unknown> | Array<Record<string, unknown>>
}

/**
 * Renders one or more schema.org JSON-LD blocks. Stay-of-the-mill server
 * component that escapes < > & to avoid HTML injection from user-controlled
 * fields (club descriptions, event titles, etc).
 */
export function JsonLd({ data }: JsonLdProps) {
  const json = JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  )
}

export type BreadcrumbItem = { name: string; url: string }

export function breadcrumbList(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

export function organization() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/icon.svg`,
  }
}

export function website(locale: 'fr' | 'en') {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: `${SITE_URL}/${locale}`,
    inLanguage: locale === 'fr' ? 'fr-CA' : 'en-CA',
  }
}

export type SportsOrgInput = {
  locale: 'fr' | 'en'
  name: string
  slug: string
  description: string | null
  website?: string | null
  instagram?: string | null
  facebook?: string | null
  stravaSlug?: string | null
}

export function sportsOrganization({
  locale,
  name,
  slug,
  description,
  website,
  instagram,
  facebook,
  stravaSlug,
}: SportsOrgInput) {
  const sameAs: string[] = []
  if (website)
    sameAs.push(website.startsWith('http') ? website : `https://${website}`)
  if (instagram) sameAs.push(`https://www.instagram.com/${instagram}`)
  if (facebook) {
    sameAs.push(
      facebook.includes('facebook.com')
        ? facebook.startsWith('http')
          ? facebook
          : `https://${facebook}`
        : `https://www.facebook.com/${facebook}`
    )
  }
  if (stravaSlug) sameAs.push(`https://www.strava.com/clubs/${stravaSlug}`)

  return {
    '@context': 'https://schema.org',
    '@type': 'SportsOrganization',
    name,
    url: `${SITE_URL}/${locale}/clubs/${slug}`,
    description: description ?? undefined,
    sport: 'Running',
    areaServed: {
      '@type': 'City',
      name: 'Québec',
    },
    ...(sameAs.length > 0 && { sameAs }),
  }
}

export type EventJsonLdInput = {
  locale: 'fr' | 'en'
  url: string
  title: string
  description: string | null
  startDate: Date | string
  endDate?: Date | string
  address: string | null
  latitude: number | null
  longitude: number | null
  clubName: string
  clubUrl: string
}

export function eventJsonLd({
  url,
  title,
  description,
  startDate,
  endDate,
  address,
  latitude,
  longitude,
  clubName,
  clubUrl,
}: EventJsonLdInput) {
  const start =
    typeof startDate === 'string' ? startDate : startDate.toISOString()
  const end = endDate
    ? typeof endDate === 'string'
      ? endDate
      : endDate.toISOString()
    : undefined

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: title,
    description: description ?? undefined,
    startDate: start,
    ...(end && { endDate: end }),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    isAccessibleForFree: true,
    url,
    location: {
      '@type': 'Place',
      name: address ?? clubName,
      ...(address && {
        address: {
          '@type': 'PostalAddress',
          streetAddress: address,
          addressLocality: 'Québec',
          addressRegion: 'QC',
          addressCountry: 'CA',
        },
      }),
      ...(latitude != null &&
        longitude != null && {
          geo: {
            '@type': 'GeoCoordinates',
            latitude,
            longitude,
          },
        }),
    },
    organizer: {
      '@type': 'SportsOrganization',
      name: clubName,
      url: clubUrl,
    },
  }
}
