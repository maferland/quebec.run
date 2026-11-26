import { ExploreShell } from '@/components/explore/explore-shell'
import { ExploreProviders } from '@/app/providers'
import { getClubsForExplore } from '@/lib/services/clubs'
import { getExploreSnapshot } from '@/lib/services/events'

// Keep the client shell in the shared layout so maps and detail transitions
// survive navigation. Date-dependent pages set their own refresh interval;
// stable data remains cached until its dependency tags are invalidated.
export const revalidate = false

export default async function ExploreLayout({
  children,
  detail,
}: {
  children: React.ReactNode
  detail: React.ReactNode
}) {
  const [snapshot, clubs] = await Promise.all([
    getExploreSnapshot(),
    getClubsForExplore(),
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
        initialData={snapshot ? { ...snapshot, clubs } : undefined}
        serverDetail={detail}
      />
      {children}
    </ExploreProviders>
  )
}
