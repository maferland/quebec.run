'use client'

import { useState } from 'react'
import { EventCard } from '@/components/events/event-card'
import type { EventCardProps } from '@/components/events/event-card'
import { ContentGrid } from '@/components/ui/content-grid'
import { Button } from '@/components/ui/button'

const INITIAL_COUNT = 10

type ClubEventsListProps = {
  events: EventCardProps['event'][]
}

export function ClubEventsList({ events }: ClubEventsListProps) {
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? events : events.slice(0, INITIAL_COUNT)
  const hasMore = events.length > INITIAL_COUNT

  return (
    <div>
      <ContentGrid columns="2" gap="lg">
        {visible.map((event) => (
          <EventCard key={event.id} event={event} showClubName={false} />
        ))}
      </ContentGrid>
      {hasMore && !showAll && (
        <div className="mt-6 text-center">
          <Button variant="outline" onClick={() => setShowAll(true)}>
            Show all {events.length} events
          </Button>
        </div>
      )}
    </div>
  )
}
