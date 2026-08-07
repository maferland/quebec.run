import { notFound, permanentRedirect } from 'next/navigation'
import {
  getEventByClubAndSlug,
  getTorontoDayBounds,
} from '@/lib/services/events'
import { getPlacePage } from '@/lib/services/recurring-events'

export const dynamicParams = true

type Props = {
  params: Promise<{ locale: string; slug: string; place: string; date: string }>
}

// A dated club/place URL never renders on its own: it only ever hands off to
// the place page (past) or the run's own SSR'd panel (future).
export default async function EventDateRedirect({ params }: Props) {
  const { locale, slug, place: placeSlug, date } = await params

  if (new Date(`${date}T23:59:59`) < getTorontoDayBounds(0).start) {
    const place = await getPlacePage({ clubSlug: slug, placeSlug }).catch(
      () => null
    )
    permanentRedirect(
      `/${locale}/clubs/${slug}/events/${place?.primarySlug ?? placeSlug}`
    )
  }

  const event = await getEventByClubAndSlug({
    data: { clubSlug: slug, eventSlug: placeSlug, date },
  }).catch(() => null)
  if (!event) notFound()

  permanentRedirect(`/${locale}/run/${event.id}`)
}
