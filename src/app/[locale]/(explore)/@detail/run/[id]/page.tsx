import { notFound } from 'next/navigation'
import { RunDetailPanel } from '@/components/explore/run-detail'
import { toRunDetail } from '@/lib/hooks/use-explore'
import { getEventById, toRunDetailResponse } from '@/lib/services/events'

// Next.js requires a literal here; keep in sync with PUBLIC_PAGE_REVALIDATE_SECONDS in public-cache.ts.
export const revalidate = 86400
export const dynamicParams = true

type Props = { params: Promise<{ locale: string; id: string }> }

export default async function RunDetailSlot({ params }: Props) {
  const { locale, id } = await params
  const event = await getEventById({ data: { id } }).catch(() => null)
  const response = toRunDetailResponse(event)
  if (!response) notFound()

  return <RunDetailPanel run={toRunDetail(response)} locale={locale} />
}
