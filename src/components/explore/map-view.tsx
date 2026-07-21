'use client'
import dynamic from 'next/dynamic'

export type MapPoint = {
  id: string
  lat: number
  lng: number
  kind: 'run' | 'club'
  cancelled?: boolean
  past?: boolean
  label?: string
}

export type MapInsets = {
  left: number
  top: number
  bottom: number
}

export type MapViewProps = {
  points: MapPoint[]
  activeId: string | null
  onSelect: (id: string) => void
  theme: 'dark' | 'light'
  insets: MapInsets
  hideInactive?: boolean
}

const MapViewContent = dynamic(
  () => import('./map-view-content').then((m) => m.MapViewContent),
  { ssr: false }
)

export function MapView(props: MapViewProps) {
  return <MapViewContent {...props} />
}
