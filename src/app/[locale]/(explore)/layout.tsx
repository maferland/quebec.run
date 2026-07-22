import { ExploreShell } from '@/components/explore/explore-shell'
import { getClubsForExplore } from '@/lib/services/clubs'
import { getEventsForDay, getWeekEventCounts } from '@/lib/services/events'
import { ExploreProviders } from '@/app/providers'

export const revalidate = 900

export default async function ExploreLayout({
  children,
  modal,
}: {
  children: React.ReactNode
  modal: React.ReactNode
}) {
  const [weekCounts, runs, clubs] = await Promise.all([
    getWeekEventCounts().catch(() => undefined),
    getEventsForDay(0).catch(() => undefined),
    getClubsForExplore().catch(() => undefined),
  ])

  return (
    <ExploreProviders>
      <link rel="preconnect" href="https://a.basemaps.cartocdn.com" />
      <ExploreShell initialData={{ day: 0, weekCounts, runs, clubs }} />
      {children}
      <div className="fixed inset-0 z-[1300] pointer-events-none">{modal}</div>
    </ExploreProviders>
  )
}
