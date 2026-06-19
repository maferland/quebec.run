import { ExploreShell } from '@/components/explore/explore-shell'
import { RunDetailOverlay } from '@/components/explore/detail-panel'

export const dynamic = 'force-dynamic'
export const dynamicParams = true

type Props = { params: Promise<{ id: string }> }

export default async function RunPage({ params }: Props) {
  const { id } = await params
  return (
    <>
      <ExploreShell />
      <RunDetailOverlay id={id} />
    </>
  )
}
