import { notFound } from 'next/navigation'
import { ClubDetailPanel } from '@/components/explore/club-detail'
import { toClubDetail } from '@/lib/hooks/use-explore'
import { getClubDetailBySlug } from '@/lib/services/clubs'

export const revalidate = 900
export const dynamicParams = true

type Props = { params: Promise<{ locale: string; slug: string }> }

export default async function ClubDetailSlot({ params }: Props) {
  const { locale, slug } = await params
  const club = await getClubDetailBySlug(slug, locale).catch(() => null)
  if (!club) notFound()

  return <ClubDetailPanel club={toClubDetail(club)} />
}
