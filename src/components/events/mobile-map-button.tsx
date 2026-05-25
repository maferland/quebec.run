'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { MapPin, X } from 'lucide-react'
import { EventMap } from '@/components/map/event-map'
import type { ComponentProps } from 'react'

type EventList = ComponentProps<typeof EventMap>['events']

export type MobileMapButtonProps = {
  events: EventList
  emptyMessage?: string
}

export function MobileMapButton({
  events,
  emptyMessage,
}: MobileMapButtonProps) {
  const [open, setOpen] = useState(false)
  const t = useTranslations('events')

  useEffect(() => {
    if (!open) return
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 lg:hidden"
        aria-label={t('map.openButton')}
      >
        <MapPin aria-hidden="true" className="h-6 w-6" />
      </button>

      {open && (
        <>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t('map.closeButton')}
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t('map.title')}
            className="fixed inset-x-0 bottom-0 z-50 flex h-[75vh] flex-col rounded-t-2xl border-t border-border bg-surface shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-base font-heading font-bold text-primary">
                {t('map.title')}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-2 hover:bg-surface-variant"
                aria-label={t('map.closeButton')}
              >
                <X aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <EventMap
                events={events}
                height="fill"
                emptyMessage={emptyMessage}
              />
            </div>
          </div>
        </>
      )}
    </>
  )
}
