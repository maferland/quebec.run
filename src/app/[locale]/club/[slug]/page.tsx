import { ExploreShell } from '@/components/explore/explore-shell'
import { ClubDetailOverlay } from '@/components/explore/detail-panel'

export const dynamic = 'force-dynamic'
export const dynamicParams = true

type Props = { params: Promise<{ slug: string }> }

export default async function ClubPage({ params }: Props) {
  const { slug } = await params
  return (
    <>
      <ExploreShell />
      <ClubDetailOverlay slug={slug} />
    </>
  )
}
