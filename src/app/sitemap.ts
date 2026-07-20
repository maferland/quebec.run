import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { SITE_URL } from '@/lib/seo/metadata'

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
    lastModified: new Date(),
    alternates: alternates(path),
  }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const clubs = await prisma.club.findMany({
    where: { isActive: true },
    select: { slug: true, updatedAt: true },
  })

  return [
    ...staticEntry('', 1.0, 'daily'),
    ...clubs.flatMap((club) =>
      LOCALES.map((locale: Locale) => ({
        url: `${SITE_URL}/${locale}/clubs/${club.slug}`,
        priority: 0.7,
        changeFrequency: 'weekly' as const,
        lastModified: club.updatedAt,
        alternates: alternates(`/clubs/${club.slug}`),
      }))
    ),
  ]
}
