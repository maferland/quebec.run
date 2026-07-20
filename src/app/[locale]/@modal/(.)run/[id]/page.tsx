import { RunDetailOverlay } from '@/components/explore/detail-panel'

type Props = { params: Promise<{ id: string }> }

export default async function RunModalPage({ params }: Props) {
  const { id } = await params
  return <RunDetailOverlay id={id} backBehavior="history" />
}
