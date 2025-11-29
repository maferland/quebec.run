'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-markercluster'
import { Icon } from 'leaflet'
import { format } from 'date-fns'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'

// Custom pink marker icon
const markerIcon = new Icon({
  iconUrl:
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCAyNSA0MSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTIuNSAwQzUuNTk2NDQgMCAwIDUuNTk2NDQgMCAxMi41QzAgMjEuODc1IDEyLjUgNDEgMTIuNSA0MUMyNS41IDE5IDI1IDIxLjg3NSAyNSAxMi41QzI1IDUuNTk2NDQgMTkuNDAzNiAwIDEyLjUgMFoiIGZpbGw9IiNFQzQ4OTkiLz48Y2lyY2xlIGN4PSIxMi41IiBjeT0iMTIuNSIgcj0iNSIgZmlsbD0id2hpdGUiLz48L3N2Zz4=',
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
              <div className="min-w-[220px] p-1">
                <h3 className="font-heading font-bold text-gray-900 text-base mb-3 leading-tight">
                  {event.title}
                </h3>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-gray-500 text-xs uppercase tracking-wide min-w-[40px]">
                      {t('date')}
                    </span>
                    <span className="text-gray-900 font-medium">
                      {format(event.date, 'PPP')}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-gray-500 text-xs uppercase tracking-wide min-w-[40px]">
                      {t('time')}
                    </span>
                    <span className="text-gray-900 font-medium">
                      {event.time}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-gray-500 text-xs uppercase tracking-wide min-w-[40px]">
                      {t('club')}
                    </span>
                    <Link
                      href={`/clubs/${event.club.slug}`}
                      className="text-pink-600 hover:text-pink-700 font-medium hover:underline"
                    >
                      {event.club.name}
                    </Link>
                  </div>
                  {event.address && (
                    <div className="flex items-start gap-2 pt-1">
                      <span className="text-gray-500 text-xs uppercase tracking-wide min-w-[40px] pt-0.5">
                        {t('address')}
                      </span>
                      <span className="text-gray-700 text-xs leading-relaxed">
                        {event.address}
                      </span>
                    </div>
                  )}
                </div>
                <Link href={`/events/${event.id}`}>
                  <Button
                    size="sm"
                    className="w-full bg-pink-600 hover:bg-pink-700 text-white"
                  >
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
