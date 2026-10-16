import { ExploreShell } from '@/components/explore/explore-shell'
import { ExploreProviders } from '@/app/providers'
import { getClubsForExplore } from '@/lib/services/clubs'
import { getExploreSnapshot } from '@/lib/services/events'

// The shell is shared by every club and event URL. Keep it independent of the
// request so those pages can be served from the full route cache.
export const revalidate = 86400

export default async function ExploreLayout({
  children,
  detail,
}: {
  children: React.ReactNode
  detail: React.ReactNode
}) {
  const [snapshot, clubs] = await Promise.all([
    getExploreSnapshot().catch(() => undefined),
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
        initialData={snapshot ? { ...snapshot, clubs } : undefined}
        serverDetail={detail}
      />
      {children}
    </ExploreProviders>
  )
}
