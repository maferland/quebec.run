import { notFound } from 'next/navigation'
import { ClubDetailPanel } from '@/components/explore/club-detail'
import { toClubDetail } from '@/lib/hooks/use-explore'
import { getClubDetailBySlug } from '@/lib/services/clubs'

// Next.js requires a literal here; keep in sync with PUBLIC_PAGE_REVALIDATE_SECONDS in public-cache.ts.
export const revalidate = 86400
export const dynamicParams = true

type Props = { params: Promise<{ locale: string; slug: string }> }

export default async function ClubDetailSlot({ params }: Props) {
  const { locale, slug } = await params
  const club = await getClubDetailBySlug(slug, locale).catch(() => null)
  if (!club) notFound()

  return <ClubDetailPanel club={toClubDetail(club)} />
}
