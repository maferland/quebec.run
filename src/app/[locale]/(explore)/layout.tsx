import { ExploreShell } from '@/components/explore/explore-shell'
import { getClubsForExplore } from '@/lib/services/clubs'
import { getEventsForDay, getWeekEventCounts } from '@/lib/services/events'
import { ExploreProviders } from '@/app/providers'

// Next.js requires a literal here; keep in sync with PUBLIC_PAGE_REVALIDATE_SECONDS in public-cache.ts.
export const revalidate = 86400

export default async function ExploreLayout({
  children,
  detail,
}: {
  children: React.ReactNode
  detail: React.ReactNode
}) {
  const [weekCounts, runs, clubs] = await Promise.all([
    getWeekEventCounts().catch(() => undefined),
    getEventsForDay(0).catch(() => undefined),
    getClubsForExplore().catch(() => undefined),
  ])

  return (
    <ExploreProviders>
      <link rel="preconnect" href="https://a.basemaps.cartocdn.com" />
      <link
        rel="preload"
        as="image"
        href="/map-preview-mobile.webp"
        media="(max-width: 767px)"
        fetchPriority="high"
      />
      <link
        rel="preload"
        as="image"
        href="/map-preview-desktop.webp"
        media="(min-width: 768px)"
        fetchPriority="high"
      />
      <ExploreShell
        initialData={{ day: 0, weekCounts, runs, clubs }}
        serverDetail={detail}
      />
      {children}
    </ExploreProviders>
  )
}
