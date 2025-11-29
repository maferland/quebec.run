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
              <div className="min-w-[260px] p-2">
                <h3 className="font-heading font-bold text-blue-700 text-lg mb-1 leading-tight">
                  {event.title}
                </h3>
                <p className="text-gray-600 text-sm mb-3">{event.club.name}</p>

                <div className="flex items-center gap-2 mb-4 text-xs">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {format(event.date, 'MMM d')} • {event.time}
                  </span>
                </div>

                {event.address && (
                  <div className="flex items-start gap-2 mb-4">
                    <svg
                      className="w-4 h-4 text-pink-600 mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-700 text-sm leading-relaxed">
                      {event.address}
                    </span>
                  </div>
                )}

                <Link href={`/events/${event.id}`}>
                  <Button
                    size="sm"
                    className="w-full bg-blue-700 hover:bg-blue-800 text-white"
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
