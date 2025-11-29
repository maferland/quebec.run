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

// Fix default marker icon issue with Leaflet + bundlers
const defaultIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
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
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <MarkerClusterGroup>
        {events.map((event) => (
          <Marker
            key={event.id}
            position={[event.latitude, event.longitude]}
            icon={defaultIcon}
          >
            <Popup>
              <div className="min-w-[200px]">
                <h3 className="font-heading font-semibold text-primary text-lg mb-2">
                  {event.title}
                </h3>
                <div className="space-y-1 text-sm text-accent mb-3">
                  <p>
                    <strong>{t('date')}</strong> {format(event.date, 'PPP')}
                  </p>
                  <p>
                    <strong>{t('time')}</strong> {event.time}
                  </p>
                  <p>
                    <strong>{t('club')}</strong>{' '}
                    <Link
                      href={`/clubs/${event.club.slug}`}
                      className="text-primary hover:underline"
                    >
                      {event.club.name}
                    </Link>
                  </p>
                  {event.address && (
                    <p>
                      <strong>{t('address')}</strong> {event.address}
                    </p>
                  )}
                </div>
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
