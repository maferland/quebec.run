import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { Tag } from '@/components/ui/tag'
import { LocationCard } from '@/components/ui/location'
import { Icon } from '@/components/ui/icon'
import { eventUrl } from '@/lib/utils/event-url'
import { formatDateTime } from '@/lib/utils/date-formatting'
import { Clock, BookmarkCheck } from 'lucide-react'
import type { GetAllEventsReturn } from '@/lib/services/events'

export type OverrideEventCardProps = {
  event: GetAllEventsReturn
}

export function OverrideEventCard({ event }: OverrideEventCardProps) {
  const t = useTranslations('events')

  return (
    <Link href={eventUrl(event)} className="block">
      <article className="overflow-hidden rounded-xl border border-secondary/30 bg-gradient-to-br from-secondary/10 via-secondary/5 to-transparent shadow-sm transition-shadow hover:shadow-md">
        <header className="flex items-center gap-2 border-b border-secondary/30 bg-secondary/15 px-4 py-2">
          <Icon icon={BookmarkCheck} size="sm" color="secondary" decorative />
          <span className="text-xs font-heading font-bold uppercase tracking-wider text-secondary">
            {t('locations.takeNote')}
          </span>
        </header>

        <div className="p-4 md:p-5">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {event.club && (
                <p className="mb-1 text-[11px] font-heading font-semibold uppercase tracking-wider text-text-secondary">
                  {event.club.name}
                </p>
              )}
              <h3 className="text-lg font-heading font-bold text-primary hover:underline line-clamp-2 leading-tight">
                {event.title}
              </h3>
            </div>
            <Tag variant="datetime" icon={Clock} size="xs">
              {formatDateTime(event.date, event.time)}
            </Tag>
          </div>

          {event.description && (
            <p className="mb-3 text-sm text-text-secondary font-body leading-relaxed line-clamp-2">
              {event.description}
            </p>
          )}

          {(event.distance || event.pace) && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {event.distance && (
                <Tag variant="distance" size="xs">
                  {event.distance}
                </Tag>
              )}
              {event.pace && (
                <Tag variant="pace" size="xs">
                  {event.pace}
                </Tag>
              )}
            </div>
          )}

          {event.address && <LocationCard address={event.address} />}
        </div>
      </article>
    </Link>
  )
}
