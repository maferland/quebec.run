'use client'

import { useEffect, useRef } from 'react'
import type { Map as LeafletMap } from 'leaflet'

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
        attributionControl: false,
      })

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map)

      // Add marker
      L.marker([latitude, longitude]).addTo(map).bindPopup(label)

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
      className="w-full h-48 rounded-lg border border-border"
    />
  )
}
