import { ExploreShell } from '@/components/explore/explore-shell'
import { ExploreProviders } from '@/app/providers'

// The shell is shared by every club and event URL. Keep it independent of the
// current day so those pages can be served from the full route cache.

export default function ExploreLayout({
  children,
  detail,
}: {
  children: React.ReactNode
  detail: React.ReactNode
}) {
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
      <ExploreShell serverDetail={detail} />
      {children}
    </ExploreProviders>
  )
}
