import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { SITE_URL } from '@/lib/seo/metadata'
import { getAllPlaces } from '@/lib/services/recurring-events'
import { getTorontoDayBounds } from '@/lib/services/events'
import { addDays } from 'date-fns'

const LOCALES = ['fr', 'en'] as const
type Locale = (typeof LOCALES)[number]

export const revalidate = 86400

type SitemapEntry = MetadataRoute.Sitemap[number]

function alternates(path: string): NonNullable<SitemapEntry['alternates']> {
  return {
    languages: {
      'fr-CA': `${SITE_URL}/fr${path}`,
      'en-CA': `${SITE_URL}/en${path}`,
      'x-default': `${SITE_URL}/fr${path}`,
    },
  }
}

function staticEntry(
  path: string,
  priority: number,
  changeFrequency: SitemapEntry['changeFrequency']
): SitemapEntry[] {
  return LOCALES.map((locale: Locale) => ({
    url: `${SITE_URL}/${locale}${path}`,
    priority,
    changeFrequency,
    alternates: alternates(path),
  }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Events keep their time in a separate column, so anything happening later
  // today is still upcoming even though its date has passed.
  const dayStart = getTorontoDayBounds(0).start
  const horizon = addDays(dayStart, 90)
  const [clubs, places, oneOffEvents] = await Promise.all([
    prisma.club.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
    getAllPlaces(),
    prisma.event.findMany({
      where: {
        recurringEventId: null,
        status: 'SCHEDULED',
        date: { gte: dayStart, lte: horizon },
        club: { isActive: true },
      },
      select: { id: true, slug: true, updatedAt: true },
    }),
  ])

  const placeEntries = places.flatMap((place) => {
    const path = `/clubs/${place.clubSlug}/events/${place.placeSlug}`
    return LOCALES.map((locale: Locale) => ({
      url: `${SITE_URL}/${locale}${path}`,
      priority: 0.6,
      changeFrequency: 'weekly' as const,
      lastModified: place.updatedAt,
      alternates: alternates(path),
    }))
  })

  return [
    ...staticEntry('', 1.0, 'daily'),
    ...staticEntry('/clubs', 0.8, 'weekly'),
    ...clubs.flatMap((club) =>
      LOCALES.map((locale: Locale) => ({
        url: `${SITE_URL}/${locale}/clubs/${club.slug}`,
        priority: 0.7,
        changeFrequency: 'weekly' as const,
        lastModified: club.updatedAt,
        alternates: alternates(`/clubs/${club.slug}`),
      }))
    ),
    ...placeEntries,
    ...oneOffEvents.flatMap((event) => {
      const path = `/run/${event.slug ?? event.id}`
      return LOCALES.map((locale: Locale) => ({
        url: `${SITE_URL}/${locale}${path}`,
        priority: 0.5,
        changeFrequency: 'weekly' as const,
        lastModified: event.updatedAt,
        alternates: alternates(path),
      }))
    }),
  ]
}
