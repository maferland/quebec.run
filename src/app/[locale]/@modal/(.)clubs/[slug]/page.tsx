import { ClubDetailOverlay } from '@/components/explore/detail-panel'

type Props = { params: Promise<{ slug: string }> }

export default async function ClubsModalPage({ params }: Props) {
  const { slug } = await params
  return <ClubDetailOverlay slug={slug} />
}
