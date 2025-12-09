'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-markercluster'
import { Icon } from 'leaflet'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { Tag } from '@/components/ui/tag'
import { LocationInline } from '@/components/ui/location'
import { formatDateTime } from '@/lib/utils/date-formatting'
import { Clock } from 'lucide-react'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'

// Custom blue-indigo marker icon
const markerIcon = new Icon({
  iconUrl:
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCAyNSA0MSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIuNSAwQzUuNTk2NDQgMCAwIDUuNTk2NDQgMCAxMi41QzAgMjEuODc1IDEyLjUgNDEgMTIuNSA0MUMyNS41IDE5IDI1IDIxLjg3NSAyNSAxMi41QzI1IDUuNTk2NDQgMTkuNDAzNiAwIDEyLjUgMFoiIGZpbGw9IiM0RjQ2RTUiLz48Y2lyY2xlIGN4PSIxMi41IiBjeT0iMTIuNSIgcj0iNSIgZmlsbD0id2hpdGUiLz48L3N2Zz4=',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

interface EventMapContentProps {
  events: Array<{
    id: string
    title: string
    date: Date
    time: string
    address: string | null
    latitude: number
    longitude: number
    club: { id: string; name: string; slug: string }
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
      <MarkerClusterGroup>
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
                    <p className="text-xs text-accent font-body">
                      {event.club.name}
                    </p>
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

                <Link href={`/events/${event.id}`}>
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
