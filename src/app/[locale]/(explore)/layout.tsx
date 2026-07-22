import { ExploreShell } from '@/components/explore/explore-shell'

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <ExploreShell />
      {children}
    </>
  )
}
