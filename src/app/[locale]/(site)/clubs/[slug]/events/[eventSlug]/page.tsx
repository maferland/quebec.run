import { notFound, redirect } from 'next/navigation'
import { getNextOccurrenceDate } from '@/lib/services/events'
import type { PageProps } from '@/lib/types/next'
import { format } from 'date-fns'

export type ClubEventBarePageProps = PageProps<{
  locale: string
  slug: string
  eventSlug: string
}>

export default async function ClubEventBarePage({
  params,
}: ClubEventBarePageProps) {
  const { locale, slug, eventSlug } = await params
  const next = await getNextOccurrenceDate({
    data: { clubSlug: slug, eventSlug },
  })

  if (!next) {
    notFound()
  }

  redirect(
    `/${locale}/clubs/${slug}/events/${eventSlug}/${format(next, 'yyyy-MM-dd')}`
  )
}
