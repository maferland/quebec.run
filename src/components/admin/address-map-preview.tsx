'use client'

import { useEffect, useRef } from 'react'
import type { Map as LeafletMap } from 'leaflet'
import 'leaflet/dist/leaflet.css'

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

      // Add tile layer (CartoDB light style for consistency with event maps)
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        {
          maxZoom: 19,
        }
      ).addTo(map)

      // Add marker with custom icon (matches event maps)
      const markerIcon = new L.Icon({
        iconUrl:
          'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCAyNSA0MSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIuNSAwQzUuNTk2NDQgMCAwIDUuNTk2NDQgMCAxMi41QzAgMjEuODc1IDEyLjUgNDEgMTIuNSA0MUMyNS41IDE5IDI1IDIxLjg3NSAyNSAxMi41QzI1IDUuNTk2NDQgMTkuNDAzNiAwIDEyLjUgMFoiIGZpbGw9IiM0RjQ2RTUiLz48Y2lyY2xlIGN4PSIxMi41IiBjeT0iMTIuNSIgcj0iNSIgZmlsbD0id2hpdGUiLz48L3N2Zz4=',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
      })

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
