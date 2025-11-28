'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import 'leaflet/dist/leaflet.css'

// Dynamic import to avoid SSR issues with Leaflet
const MapContent = dynamic(() => import('./event-map-content'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] md:h-[600px] w-full bg-gray-100 animate-pulse rounded-lg" />
  ),
})

interface EventMapProps {
  events: Array<{
    id: string
    title: string
    date: Date
    time: string
    address: string | null
    latitude: number | null
    longitude: number | null
    club: { id: string; name: string; slug: string }
  }>
  initialCenter?: [number, number]
  initialZoom?: number
}

export function EventMap({
  events,
  initialCenter = [46.8139, -71.208], // Quebec City
  initialZoom = 10,
}: EventMapProps) {
  const eventsWithCoords = useMemo(
    () =>
      events.filter(
        (
          event
        ): event is typeof event & { latitude: number; longitude: number } =>
          event.latitude !== null && event.longitude !== null
      ),
    [events]
  )

  if (eventsWithCoords.length === 0) {
    return (
      <div
        className="h-[400px] md:h-[600px] w-full bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center"
        role="application"
        aria-label="Interactive event map"
      >
        <p className="text-gray-500 text-center px-4">
          Events will appear on the map once addresses are geocoded.
        </p>
      </div>
    )
  }

  return (
    <div
      className="h-[400px] md:h-[600px] w-full rounded-lg overflow-hidden"
      role="application"
      aria-label="Interactive event map"
    >
      <MapContent
        events={eventsWithCoords}
        initialCenter={initialCenter}
        initialZoom={initialZoom}
      />
    </div>
  )
}
