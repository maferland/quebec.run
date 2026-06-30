'use client'
import { useEffect, useRef } from 'react'
import type { MapViewProps } from './map-view'
import 'leaflet/dist/leaflet.css'

const QC_CENTER: [number, number] = [46.8123, -71.208]

const TILES = {
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  light:
    'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
}

export function MapViewContent({
  points,
  activeId,
  onSelect,
  theme,
  insets,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const tileRef = useRef<L.TileLayer | null>(null)
  const markersRef = useRef<Record<string, L.Marker>>({})
  const insetsRef = useRef(insets)
  const lastFlyRef = useRef<string | null>(null)
  insetsRef.current = insets

  useEffect(() => {
    if (!containerRef.current) return
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require('leaflet') as typeof import('leaflet')

    const map = L.map(containerRef.current, {
      center: QC_CENTER,
      zoom: 13,
      zoomControl: false,
      attributionControl: true,
      zoomSnap: 0.25,
    })

    const mkLayer = (variant: 'dark' | 'light') =>
      L.tileLayer(TILES[variant], {
        subdomains: 'abcd',
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap &copy; CARTO',
      })

    tileRef.current = mkLayer(theme).addTo(map)
    mapRef.current = map

    const ro = new ResizeObserver(() => map.invalidateSize({ animate: false }))
    ro.observe(containerRef.current!)

    return () => {
      ro.disconnect()
      map.remove()
      mapRef.current = null
    }
    // mount once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // tile swap on theme change
  useEffect(() => {
    const map = mapRef.current
    const prev = tileRef.current
    if (!map) return
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require('leaflet') as typeof import('leaflet')
    const next = L.tileLayer(TILES[theme], {
      subdomains: 'abcd',
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap &copy; CARTO',
    }).addTo(map)
    const drop = () => {
      try {
        if (prev && prev !== next) map.removeLayer(prev)
      } catch {}
    }
    next.on('load', drop)
    setTimeout(drop, 900)
    tileRef.current = next
  }, [theme])

  // sync markers
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require('leaflet') as typeof import('leaflet')

    const seen = new Set<string>()
    points.forEach((p) => {
      seen.add(p.id)
      const cls = [
        'pin',
        p.kind === 'club' ? 'is-club' : 'is-accent',
        p.cancelled ? 'is-cancelled' : '',
        p.past ? 'is-past' : '',
        p.id === activeId ? 'is-active' : '',
      ]
        .filter(Boolean)
        .join(' ')
      const html = `<div class="${cls}"><div class="pin-ring"></div><div class="pin-dot"></div>${p.label ? `<div class="pin-label">${p.label}</div>` : ''}</div>`
      const icon = L.divIcon({
        html,
        className: 'pin-wrap',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      })

      let m = markersRef.current[p.id]
      if (!m) {
        m = L.marker([p.lat, p.lng], {
          icon,
          riseOnHover: true,
          keyboard: false,
        })
        m.on('click', () => onSelect(p.id))
        m.addTo(map)
        markersRef.current[p.id] = m
      } else {
        m.setIcon(icon)
        m.setLatLng([p.lat, p.lng])
      }
      m.setZIndexOffset(p.id === activeId ? 1000 : 0)
    })

    Object.keys(markersRef.current).forEach((id) => {
      if (!seen.has(id)) {
        map.removeLayer(markersRef.current[id])
        delete markersRef.current[id]
      }
    })
  }, [points, activeId, onSelect])

  // fly to active
  useEffect(() => {
    const map = mapRef.current
    if (!map || !activeId) return
    if (lastFlyRef.current === activeId) return
    const p = points.find((x) => x.id === activeId)
    if (!p) return
    lastFlyRef.current = activeId
    flyOffset(
      map,
      [p.lat, p.lng],
      Math.max(map.getZoom(), 14),
      insetsRef.current
    )
  }, [activeId, points])

  // fit bounds when points change and nothing active
  const sig = points.map((p) => p.id).join(',')
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require('leaflet') as typeof import('leaflet')
    if (activeId) {
      lastFlyRef.current = null
      const p = points.find((x) => x.id === activeId)
      if (p)
        flyOffset(
          map,
          [p.lat, p.lng],
          Math.max(map.getZoom(), 14),
          insetsRef.current
        )
      return
    }
    lastFlyRef.current = null
    const ins = insetsRef.current
    if (points.length === 0) {
      map.flyTo(QC_CENTER, 12.5, { duration: 0.6 })
      return
    }
    if (points.length === 1) {
      flyOffset(map, [points[0].lat, points[0].lng], 14, ins)
      return
    }
    const bounds = L.latLngBounds(
      points.map((p) => [p.lat, p.lng] as [number, number])
    )
    map.flyToBounds(bounds, {
      paddingTopLeft: [ins.left + 50, ins.top + 50],
      paddingBottomRight: [50, ins.bottom + 50],
      duration: 0.7,
      maxZoom: 15,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig])

  return (
    <div
      role="application"
      aria-label="Interactive event map"
      ref={containerRef}
      style={{ position: 'absolute', inset: 0, zIndex: 0 }}
    />
  )
}

function flyOffset(
  map: L.Map,
  latlng: [number, number],
  zoom: number,
  ins: { left: number; top: number; bottom: number }
) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const L = require('leaflet') as typeof import('leaflet')
  const p = map.project(L.latLng(latlng), zoom)
  const center = map.unproject(
    p.subtract(
      L.point(-(ins.left || 0) / 2, (ins.bottom || 0) / 2 - (ins.top || 0) / 2)
    ),
    zoom
  )
  map.flyTo(center, zoom, { duration: 0.7, easeLinearity: 0.25 })
}
