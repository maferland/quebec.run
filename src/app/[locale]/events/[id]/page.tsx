import { notFound, redirect, permanentRedirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { LEGACY_VIRTUAL_SLUG_MAP } from '@/lib/utils/legacy-event-slugs'
import type { PageProps } from '@/lib/types/next'

export type LegacyEventPageProps = PageProps<{ id: string }>

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
  const { id } = await params

  const slugMatch = id.match(/^(.+)--(\d{4}-\d{2}-\d{2})$/)
  if (slugMatch) {
    const [, legacySlug, date] = slugMatch
    const mapped = LEGACY_VIRTUAL_SLUG_MAP[legacySlug]
    if (mapped) {
      permanentRedirect(
        `/clubs/${mapped.clubSlug}/events/${mapped.eventSlug}/${date}`
      )
    }
    notFound()
  }

  const cuidMatch = id.match(/^(.+):(\d{4}-\d{2}-\d{2})$/)
  if (cuidMatch) {
    const [, recurringId, date] = cuidMatch
    const re = await prisma.recurringEvent.findUnique({
      where: { id: recurringId },
      select: { slug: true, club: { select: { slug: true } } },
    })
    if (re) {
      permanentRedirect(`/clubs/${re.club.slug}/events/${re.slug}/${date}`)
    }
    notFound()
  }

  // Concrete event by cuid — keep on this page for now (rare). Could redirect
  // to a nested URL when concrete events grow their own slug column.
  const concrete = await prisma.event.findUnique({
    where: { id },
    select: {
      date: true,
      recurringEvent: { select: { slug: true } },
      club: { select: { slug: true } },
    },
  })
  if (!concrete?.club || !concrete.recurringEvent) {
    notFound()
  }

  const date = concrete.date.toISOString().slice(0, 10)
  redirect(
    `/clubs/${concrete.club.slug}/events/${concrete.recurringEvent.slug}/${date}`
  )
}
