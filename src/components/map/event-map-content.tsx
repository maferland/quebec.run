'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { useTheme } from '@/components/explore/theme-provider'
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
import { markerIconConfig, TILE_ATTRIBUTION, TILE_URLS } from '@/lib/utils/map'
import { ChevronRight, Clock } from 'lucide-react'

// Marker pin, shared with the other maps
const markerIcon = new Icon(markerIconConfig)

// Cluster bubble matches the pin so the visual language
// stays consistent at every zoom level. Size scales with the count.
const createClusterIcon = (cluster: MarkerCluster) => {
  const count = cluster.getChildCount()
  const size = count < 10 ? 36 : count < 100 ? 44 : 52
  return divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;
      background:#C9A5F8;
      color:#2F1F4A;
      border:3px solid rgba(255,255,255,0.35);
      border-radius:9999px;
      display:flex;align-items:center;justify-content:center;
      font-weight:600;font-family:inherit;
      box-shadow:0 4px 12px rgba(0,0,0,0.35);
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
  const { theme } = useTheme()
  const groups = groupByLocation(events)

  return (
    <MapContainer
      center={initialCenter}
      zoom={initialZoom}
      scrollWheelZoom={true}
      className="h-full w-full"
    >
      <TileLayer url={TILE_URLS[theme]} attribution={TILE_ATTRIBUTION} />
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
                    <ul className="m-0 p-0 list-none grid justify-start gap-y-1">
                      {group.map((event) => (
                        <li key={event.id}>
                          <Link
                            href={eventUrl(event)}
                            className="block transition-opacity hover:opacity-80"
                          >
                            <Tag
                              variant="datetime"
                              icon={Clock}
                              size="xs"
                              className="tabular-nums"
                            >
                              <span className="flex-1">
                                {formatDateTime(event.date, event.time)}
                              </span>
                              <ChevronRight
                                aria-hidden="true"
                                className="size-3.5 -mr-0.5 opacity-70 shrink-0"
                              />
                            </Tag>
                          </Link>
                        </li>
                      ))}
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
