'use client'
import { useEffect, useRef, useState } from 'react'
import * as L from 'leaflet'
import type { MapViewProps } from './map-view'
import 'leaflet/dist/leaflet.css'

const QC_CENTER: [number, number] = [46.8123, -71.208]
const INITIAL_ZOOM = 10

const TILES = {
  dark: 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
  light: 'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
}
const FIT_PADDING = 96

function createTileLayer(theme: 'dark' | 'light') {
  return L.tileLayer(TILES[theme], {
    subdomains: 'abcd',
    maxZoom: 19,
    updateWhenZooming: false,
    keepBuffer: 1,
    attribution: '&copy; OpenStreetMap &copy; CARTO',
  })
}

export function MapViewContent({
  points,
  activeId,
  onSelect,
  theme,
  insets,
  hideInactive = false,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const tileRef = useRef<L.TileLayer | null>(null)
  const tileThemeRef = useRef(theme)
  const markersRef = useRef<Record<string, L.Marker>>({})
  const insetsRef = useRef(insets)
  const pointsRef = useRef(points)
  const activeIdRef = useRef(activeId)
  const onSelectRef = useRef(onSelect)
  const lastFlyRef = useRef<string | null>(null)
  const lastFitRef = useRef<string | null>(null)
  const hasPositionedRef = useRef(false)
  const [mapReady, setMapReady] = useState(false)
  insetsRef.current = insets
  pointsRef.current = points
  activeIdRef.current = activeId
  onSelectRef.current = onSelect

  useEffect(() => {
    if (!containerRef.current) return

    const map = L.map(containerRef.current, {
      center: QC_CENTER,
      zoom: INITIAL_ZOOM,
      zoomControl: false,
      attributionControl: true,
      zoomSnap: 0.25,
    })

    const initialPoints = pointsRef.current
    const initialActiveId = activeIdRef.current
    const initialInsets = insetsRef.current
    const activePoint = initialPoints.find(
      (point) => point.id === initialActiveId
    )
    if (activePoint) {
      positionOffset(
        map,
        [activePoint.lat, activePoint.lng],
        14,
        initialInsets,
        { animate: false }
      )
      lastFlyRef.current = flyKey(activePoint.id, initialInsets)
      hasPositionedRef.current = true
    } else if (initialPoints.length === 1) {
      positionOffset(
        map,
        [initialPoints[0].lat, initialPoints[0].lng],
        14,
        initialInsets,
        { animate: false }
      )
      lastFitRef.current = pointSignature(initialPoints)
      hasPositionedRef.current = true
    } else if (initialPoints.length > 1) {
      map.fitBounds(createBounds(initialPoints), {
        ...fitBoundsOptions(initialInsets),
        animate: false,
      })
      lastFitRef.current = pointSignature(initialPoints)
      hasPositionedRef.current = true
    }

    tileThemeRef.current = theme
    tileRef.current = createTileLayer(theme).addTo(map)
    mapRef.current = map
    syncMarkers(
      map,
      markersRef.current,
      pointsRef.current,
      activeIdRef.current,
      onSelectRef.current,
      hideInactive
    )
    setMapReady(true)

    const ro = new ResizeObserver(() => map.invalidateSize({ animate: false }))
    ro.observe(containerRef.current!)

    return () => {
      ro.disconnect()
      map.remove()
      mapRef.current = null
      markersRef.current = {}
      setMapReady(false)
    }
    // mount once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // tile swap on theme change
  useEffect(() => {
    const map = mapRef.current
    const prev = tileRef.current
    if (!map || tileThemeRef.current === theme) return
    const next = createTileLayer(theme).addTo(map)
    const drop = () => {
      try {
        if (prev && prev !== next) map.removeLayer(prev)
      } catch {}
    }
    next.on('load', drop)
    setTimeout(drop, 900)
    tileRef.current = next
    tileThemeRef.current = theme
  }, [theme])

  // sync markers
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    syncMarkers(
      map,
      markersRef.current,
      points,
      activeId,
      onSelect,
      hideInactive
    )
  }, [points, activeId, onSelect, hideInactive, mapReady])

  // fly to active
  useEffect(() => {
    const map = mapRef.current
    if (!map || !activeId) return
    const nextFlyKey = flyKey(activeId, insets)
    if (lastFlyRef.current === nextFlyKey) return
    const p = points.find((x) => x.id === activeId)
    if (!p) return
    lastFlyRef.current = nextFlyKey
    lastFitRef.current = null
    positionOffset(map, [p.lat, p.lng], 14, insetsRef.current, {
      animate: hasPositionedRef.current,
    })
    hasPositionedRef.current = true
  }, [activeId, points, insets, mapReady])

  // fit bounds when points change and nothing active
  const sig = pointSignature(points)
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (activeId) return
    lastFlyRef.current = null
    if (lastFitRef.current === sig) return
    lastFitRef.current = sig
    const ins = insetsRef.current
    if (points.length === 0) {
      if (hasPositionedRef.current) {
        map.flyTo(QC_CENTER, 12.5, { duration: 0.6 })
      }
      return
    }
    if (points.length === 1) {
      positionOffset(map, [points[0].lat, points[0].lng], 14, ins, {
        animate: hasPositionedRef.current,
      })
      hasPositionedRef.current = true
      return
    }
    const bounds = createBounds(points)
    const options = fitBoundsOptions(ins)
    if (hasPositionedRef.current) {
      map.flyToBounds(bounds, { ...options, duration: 0.7 })
    } else {
      map.fitBounds(bounds, { ...options, animate: false })
    }
    hasPositionedRef.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, activeId, mapReady])

  return (
    <div
      role="application"
      aria-label="Interactive event map"
      ref={containerRef}
      style={{ position: 'absolute', inset: 0, zIndex: 0 }}
    />
  )
}

function pointSignature(points: MapViewProps['points']) {
  return points.map((point) => point.id).join(',')
}

function flyKey(activeId: string, insets: MapViewProps['insets']) {
  return `${activeId}:${insets.left}:${insets.top}:${insets.bottom}`
}

function createBounds(points: MapViewProps['points']) {
  return L.latLngBounds(
    points.map((point) => [point.lat, point.lng] as [number, number])
  )
}

function fitBoundsOptions(insets: MapViewProps['insets']): L.FitBoundsOptions {
  return {
    paddingTopLeft: [insets.left + FIT_PADDING, insets.top + FIT_PADDING],
    paddingBottomRight: [FIT_PADDING, insets.bottom + FIT_PADDING],
    maxZoom: 15,
  }
}

function syncMarkers(
  map: L.Map,
  markers: Record<string, L.Marker>,
  points: MapViewProps['points'],
  activeId: string | null,
  onSelect: (id: string) => void,
  hideInactive: boolean
) {
  const seen = new Set<string>()
  points.forEach((p) => {
    seen.add(p.id)
    const cls = [
      'pin',
      p.kind === 'club' ? 'is-club' : 'is-accent',
      p.cancelled ? 'is-cancelled' : '',
      p.past ? 'is-past' : '',
      p.id === activeId ? 'is-active' : '',
      activeId && p.id !== activeId ? 'is-muted' : '',
    ]
      .filter(Boolean)
      .join(' ')
    const icon = L.divIcon({
      html: createMarkerContent(cls, p.label),
      className: `pin-wrap${hideInactive && activeId && p.id !== activeId ? ' is-hidden' : ''}`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    })

    let marker = markers[p.id]
    if (!marker) {
      marker = L.marker([p.lat, p.lng], {
        icon,
        riseOnHover: true,
        keyboard: false,
      })
      marker.on('click', () => onSelect(p.id))
      marker.addTo(map)
      markers[p.id] = marker
    } else {
      marker.setIcon(icon)
      marker.setLatLng([p.lat, p.lng])
      if (!map.hasLayer(marker)) marker.addTo(map)
    }
    marker.setZIndexOffset(p.id === activeId ? 1000 : 0)
  })

  Object.keys(markers).forEach((id) => {
    if (!seen.has(id)) {
      map.removeLayer(markers[id])
      delete markers[id]
    }
  })
}

export function createMarkerContent(className: string, label?: string) {
  const root = document.createElement('div')
  root.className = className

  const ring = document.createElement('div')
  ring.className = 'pin-ring'
  root.appendChild(ring)

  const dot = document.createElement('div')
  dot.className = 'pin-dot'
  root.appendChild(dot)

  if (label) {
    const labelElement = document.createElement('div')
    labelElement.className = 'pin-label'
    labelElement.textContent = label
    root.appendChild(labelElement)
  }

  return root
}

function positionOffset(
  map: L.Map,
  latlng: [number, number],
  zoom: number,
  ins: { left: number; top: number; bottom: number },
  options: { animate: boolean }
) {
  const p = map.project(L.latLng(latlng), zoom)
  const center = map.unproject(
    p.subtract(L.point((ins.left || 0) / 2, ((ins.top || 0) - ins.bottom) / 2)),
    zoom
  )
  if (options.animate) {
    map.flyTo(center, zoom, { duration: 0.7, easeLinearity: 0.25 })
    return
  }
  map.setView(center, zoom, { animate: false })
}
