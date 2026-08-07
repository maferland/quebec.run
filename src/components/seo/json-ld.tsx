import { SITE_NAME, SITE_URL } from '@/lib/seo/metadata'
import { parseRRuleToForm } from '@/lib/utils/rrule-builder'

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
  startTime?: string
  endDate?: Date | string
  address: string | null
  latitude: number | null
  longitude: number | null
  clubName: string
  clubUrl: string
  status?: 'SCHEDULED' | 'CANCELLED'
}

export function eventJsonLd({
  url,
  title,
  description,
  startDate,
  startTime,
  endDate,
  address,
  latitude,
  longitude,
  clubName,
  clubUrl,
  locale,
  status = 'SCHEDULED',
}: EventJsonLdInput) {
  const start = startTime
    ? eventDateTime(startDate, startTime)
    : typeof startDate === 'string'
      ? startDate
      : startDate.toISOString()
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
    inLanguage: locale === 'fr' ? 'fr-CA' : 'en-CA',
    startDate: start,
    ...(end && { endDate: end }),
    eventStatus:
      status === 'CANCELLED'
        ? 'https://schema.org/EventCancelled'
        : 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
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

function eventDateTime(date: Date | string, time: string) {
  const dateValue = typeof date === 'string' ? new Date(date) : date
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZoneName: 'longOffset',
  }).formatToParts(dateValue)
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? ''
  const offset = value('timeZoneName').replace('GMT', '') || 'Z'
  return `${value('year')}-${value('month')}-${value('day')}T${time}:00${offset}`
}

const SCHEMA_WEEKDAYS: Record<string, string> = {
  MO: 'https://schema.org/Monday',
  TU: 'https://schema.org/Tuesday',
  WE: 'https://schema.org/Wednesday',
  TH: 'https://schema.org/Thursday',
  FR: 'https://schema.org/Friday',
  SA: 'https://schema.org/Saturday',
  SU: 'https://schema.org/Sunday',
}

export type PlaceJsonLdInput = {
  locale: 'fr' | 'en'
  url: string
  title: string
  description: string | null
  schedulePattern: string
  nextOccurrence: Date | null
  address: string | null
  latitude: number | null
  longitude: number | null
  clubName: string
  clubUrl: string
}

// A recurring run is one Event with an eventSchedule rather than one Event per
// date, so a single durable URL can describe every occurrence.
export function placeJsonLd({
  locale,
  url,
  title,
  description,
  schedulePattern,
  nextOccurrence,
  address,
  latitude,
  longitude,
  clubName,
  clubUrl,
}: PlaceJsonLdInput) {
  const form = parseRRuleToForm(schedulePattern)
  const byDay = form.byweekday.flatMap((code) =>
    SCHEMA_WEEKDAYS[code] ? [SCHEMA_WEEKDAYS[code]] : []
  )

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: title,
    description: description ?? undefined,
    inLanguage: locale === 'fr' ? 'fr-CA' : 'en-CA',
    ...(nextOccurrence && {
      startDate: eventDateTime(nextOccurrence, form.time),
    }),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventSchedule: {
      '@type': 'Schedule',
      repeatFrequency: form.frequency === 'biweekly' ? 'P2W' : 'P1W',
      ...(byDay.length > 0 && { byDay }),
      startTime: `${form.time}:00`,
      scheduleTimezone: 'America/Toronto',
    },
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
          geo: { '@type': 'GeoCoordinates', latitude, longitude },
        }),
    },
    organizer: {
      '@type': 'SportsOrganization',
      name: clubName,
      url: clubUrl,
    },
  }
}
