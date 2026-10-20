import { notFound, permanentRedirect } from 'next/navigation'
import { PlaceDetailPanel } from '@/components/explore/place-detail'
import { toPlaceDetail } from '@/lib/hooks/use-explore'
import { getPlacePage } from '@/lib/services/recurring-events'

// Next.js requires a literal here; keep in sync with PUBLIC_PAGE_REVALIDATE_SECONDS in public-cache.ts.
export const revalidate = 86400
export const dynamicParams = true

type Props = {
  params: Promise<{ locale: string; slug: string; place: string }>
}

export default async function PlaceDetailSlot({ params }: Props) {
  const { locale, slug, place: placeSlug } = await params
  const place = await getPlacePage({ clubSlug: slug, placeSlug }).catch(
    () => null
  )
  if (!place) notFound()
  if (place.primarySlug !== placeSlug) {
    permanentRedirect(`/${locale}/clubs/${slug}/events/${place.primarySlug}`)
  }

  return (
    <PlaceDetailPanel place={toPlaceDetail(place, locale as 'fr' | 'en')} />
  )
}
