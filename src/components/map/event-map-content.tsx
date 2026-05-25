'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import { divIcon, Icon } from 'leaflet'
import 'leaflet.markercluster'

type MarkerCluster = { getChildCount: () => number }
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { Tag } from '@/components/ui/tag'
import { LocationInline } from '@/components/ui/location'
import { formatDateTime } from '@/lib/utils/date-formatting'
import { eventUrl } from '@/lib/utils/event-url'
import { markerIconConfig } from '@/lib/utils/map'
import { Clock } from 'lucide-react'

// Custom blue-indigo marker icon
const markerIcon = new Icon(markerIconConfig)

// Cluster bubble that matches the brand pin (#4F46E5) so the visual language
// stays consistent at every zoom level. Size scales with the count.
const createClusterIcon = (cluster: MarkerCluster) => {
  const count = cluster.getChildCount()
  const size = count < 10 ? 36 : count < 100 ? 44 : 52
  return divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;
      background:#4F46E5;
      color:white;
      border:3px solid white;
      border-radius:9999px;
      display:flex;align-items:center;justify-content:center;
      font-weight:600;font-family:inherit;
      box-shadow:0 4px 12px rgba(79,70,229,0.35);
    ">${count}</div>`,
    className: 'quebec-run-cluster',
    iconSize: [size, size],
  })
}

interface EventMapContentProps {
  events: Array<{
    id: string
    title: string
    date: Date
    time: string
    address: string | null
    latitude: number
    longitude: number
    club: { id: string; name: string; slug: string } | null
  }>
  initialCenter: [number, number]
  initialZoom: number
}

export default function EventMapContent({
  events,
  initialCenter,
  initialZoom,
}: EventMapContentProps) {
  const t = useTranslations('home.map.popup')

  return (
    <MapContainer
      center={initialCenter}
      zoom={initialZoom}
      scrollWheelZoom={true}
      attributionControl={false}
      className="h-full w-full"
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
      <MarkerClusterGroup
        iconCreateFunction={createClusterIcon}
        showCoverageOnHover={false}
        maxClusterRadius={35}
      >
        {events.map((event) => (
          <Marker
            key={event.id}
            position={[event.latitude, event.longitude]}
            icon={markerIcon}
          >
            <Popup>
              <div className="min-w-[240px]">
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-heading font-bold text-primary mb-2 line-clamp-2 leading-tight">
                      {event.title}
                    </h3>
                    {event.club && (
                      <p className="text-xs text-accent font-body">
                        {event.club.name}
                      </p>
                    )}
                  </div>
                  <Tag variant="datetime" icon={Clock} size="xs">
                    {formatDateTime(event.date, event.time)}
                  </Tag>
                </div>

                {event.address && (
                  <div className="mb-3">
                    <LocationInline address={event.address} />
                  </div>
                )}

                <Link href={eventUrl(event)}>
                  <Button size="sm" variant="primary" className="w-full">
                    {t('viewDetails')}
                  </Button>
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  )
}
