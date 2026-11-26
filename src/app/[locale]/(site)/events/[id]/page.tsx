import { notFound, permanentRedirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { LEGACY_VIRTUAL_SLUG_MAP } from '@/lib/utils/legacy-event-slugs'
import type { PageProps } from '@/lib/types/next'
import { cachePublicData, PUBLIC_CACHE_TAGS } from '@/lib/public-cache'

export type LegacyEventPageProps = PageProps<{ locale: string; id: string }>

export const revalidate = false
export const dynamicParams = true

export function generateStaticParams() {
  return []
}

/**
 * Legacy /events/[id] is a permanent redirect to the canonical nested URL
 * /clubs/<club>/events/<event>/<date>. Three id shapes are accepted:
 *
 *   <legacy-virtual-slug>--<YYYY-MM-DD>   pre-migration globally unique slug
 *   <cuid>:<YYYY-MM-DD>                   even older virtual id
 *   <cuid>                                concrete one-off event
 */
export default async function LegacyEventPage({
  params,
}: LegacyEventPageProps) {
  const { locale, id } = await params

  const slugMatch = id.match(/^(.+)--(\d{4}-\d{2}-\d{2})$/)
  if (slugMatch) {
    const [, legacySlug, date] = slugMatch
    const mapped = LEGACY_VIRTUAL_SLUG_MAP[legacySlug]
    if (mapped) {
      permanentRedirect(
        `/${locale}/clubs/${mapped.clubSlug}/events/${mapped.eventSlug}/${date}`
      )
    }
    notFound()
  }

  const cuidMatch = id.match(/^(.+):(\d{4}-\d{2}-\d{2})$/)
  if (cuidMatch) {
    const [, recurringId, date] = cuidMatch
    const re = await cachePublicData(
      async () =>
        prisma.recurringEvent.findUnique({
          where: { id: recurringId },
          select: { slug: true, club: { select: { slug: true } } },
        }),
      ['legacy-schedule', recurringId],
      { revalidate: false, tags: [PUBLIC_CACHE_TAGS.schedule(recurringId)] }
    )()
    if (re) {
      permanentRedirect(
        `/${locale}/clubs/${re.club.slug}/events/${re.slug}/${date}`
      )
    }
    notFound()
  }

  if (/^c[a-z0-9]{24}$/.test(id)) {
    permanentRedirect(`/${locale}/run/${id}`)
  }

  notFound()
}
