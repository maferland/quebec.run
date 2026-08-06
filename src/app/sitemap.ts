import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { SITE_URL } from '@/lib/seo/metadata'
import { expandRRuleDates } from '@/lib/services/recurring-events'
import { addDays, format } from 'date-fns'

const LOCALES = ['fr', 'en'] as const
type Locale = (typeof LOCALES)[number]

export const revalidate = 3600

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
  const now = new Date()
  const horizon = addDays(now, 90)
  const [clubs, recurringEvents, oneOffEvents] = await Promise.all([
    prisma.club.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.recurringEvent.findMany({
      where: { isActive: true, club: { isActive: true } },
      select: {
        slug: true,
        schedulePattern: true,
        updatedAt: true,
        club: { select: { slug: true } },
      },
    }),
    prisma.event.findMany({
      where: {
        recurringEventId: null,
        status: 'SCHEDULED',
        date: { gte: now, lte: horizon },
        club: { isActive: true },
      },
      select: { id: true, slug: true, updatedAt: true },
    }),
  ])

  const recurringEntries = recurringEvents.flatMap((event) => {
    const [nextOccurrence] = expandRRuleDates(
      event.schedulePattern,
      now,
      horizon
    )
    if (!nextOccurrence) return []
    const path = `/clubs/${event.club.slug}/events/${event.slug}/${format(nextOccurrence, 'yyyy-MM-dd')}`
    return LOCALES.map((locale: Locale) => ({
      url: `${SITE_URL}/${locale}${path}`,
      priority: 0.6,
      changeFrequency: 'weekly' as const,
      lastModified: event.updatedAt,
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
    ...recurringEntries,
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
