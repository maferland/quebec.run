'use client'

import { useEffect, useRef } from 'react'
import type { Map as LeafletMap } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { createMarkerIcon, TILE_ATTRIBUTION, TILE_URLS } from '@/lib/utils/map'

interface AddressMapPreviewProps {
  latitude: number
  longitude: number
  label: string
}

export function AddressMapPreview({
  latitude,
  longitude,
  label,
}: AddressMapPreviewProps) {
  const mapRef = useRef<LeafletMap | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Dynamic import to avoid SSR issues
    import('leaflet').then((L) => {
      // Clean up existing map
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }

      // Create map
      if (!containerRef.current) return
      const map = L.map(containerRef.current, {
        center: [latitude, longitude],
        zoom: 15,
        scrollWheelZoom: false,
        dragging: false,
        zoomControl: false,
      })

      // Add tile layer (CartoDB light style for consistency with event maps)
      L.tileLayer(TILE_URLS.positron, {
        maxZoom: 19,
        attribution: TILE_ATTRIBUTION,
      }).addTo(map)

      // Add marker with custom icon (matches event maps)
      const markerIcon = createMarkerIcon(L)

      L.marker([latitude, longitude], { icon: markerIcon })
        .addTo(map)
        .bindPopup(label)

      mapRef.current = map
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [latitude, longitude, label])

  return (
    <div
      ref={containerRef}
      className="w-full h-[300px] rounded-lg border border-border"
      style={{ height: '300px', width: '100%' }}
    />
  )
}
