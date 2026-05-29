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
import { groupByLocation } from '@/lib/utils/group-by-location'
import { markerIconConfig } from '@/lib/utils/map'
import { ChevronRight, Clock } from 'lucide-react'

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

type MapEvent = {
  id: string
  title: string
  date: Date
  time: string
  address: string | null
  latitude: number
  longitude: number
  club: { id: string; name: string; slug: string } | null
}

interface EventMapContentProps {
  events: MapEvent[]
  initialCenter: [number, number]
  initialZoom: number
}

export default function EventMapContent({
  events,
  initialCenter,
  initialZoom,
}: EventMapContentProps) {
  const t = useTranslations('home.map.popup')
  const groups = groupByLocation(events)

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
        {groups.map((group) => {
          const head = group[0]
          const multi = group.length > 1
          return (
            <Marker
              key={head.id}
              position={[head.latitude, head.longitude]}
              icon={markerIcon}
            >
              <Popup>
                <div className="min-w-[240px]">
                  <h3 className="text-lg font-heading font-bold text-primary line-clamp-2 leading-tight mb-1">
                    {head.title}
                  </h3>
                  {head.club && head.club.name !== head.title && (
                    <p className="text-xs text-accent font-body mb-1">
                      {head.club.name}
                    </p>
                  )}
                  {head.address && (
                    <div className="mb-3">
                      <LocationInline address={head.address} />
                    </div>
                  )}

                  {multi ? (
                    <ul className="m-0 p-0 list-none flex flex-col gap-1.5">
                      {group.map((event) => {
                        const weekday = event.date
                          .toLocaleDateString('fr-CA', { weekday: 'short' })
                          .replace('.', '')
                        return (
                          <li key={event.id}>
                            <Link
                              href={eventUrl(event)}
                              className="flex items-center justify-between gap-3 rounded-lg border border-border-subtle bg-surface px-3 py-2 hover:border-primary hover:shadow-sm transition-all"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="font-heading font-bold text-primary tabular-nums text-base leading-none">
                                  {event.date.getDate()}
                                </span>
                                <div className="flex flex-col leading-tight">
                                  <span className="text-[10px] uppercase tracking-wider font-heading font-bold text-text-secondary">
                                    {weekday}
                                  </span>
                                  <span className="text-xs text-text-primary tabular-nums">
                                    {event.time}
                                  </span>
                                </div>
                              </div>
                              <ChevronRight
                                aria-hidden="true"
                                className="size-4 text-text-secondary shrink-0"
                              />
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  ) : (
                    <>
                      <Tag
                        variant="datetime"
                        icon={Clock}
                        size="xs"
                        className="mb-3"
                      >
                        {formatDateTime(head.date, head.time)}
                      </Tag>
                      <Link href={eventUrl(head)}>
                        <Button size="sm" variant="primary" className="w-full">
                          {t('viewDetails')}
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MarkerClusterGroup>
    </MapContainer>
  )
}
