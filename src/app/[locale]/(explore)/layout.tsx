import { ExploreShell } from '@/components/explore/explore-shell'
import { getClubsForExplore } from '@/lib/services/clubs'
import { getEventsForDay, getWeekEventCounts } from '@/lib/services/events'

export const revalidate = 900

export default async function ExploreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [weekCounts, runs, clubs] = await Promise.all([
    getWeekEventCounts().catch(() => undefined),
    getEventsForDay(0).catch(() => undefined),
    getClubsForExplore().catch(() => undefined),
  ])

  return (
    <>
      <ExploreShell initialData={{ day: 0, weekCounts, runs, clubs }} />
      {children}
    </>
  )
}
