import { getAllEvents } from '@/lib/services/events'
import { EventCard } from '@/components/events/event-card'
import { ContentGrid } from '@/components/ui/content-grid'
import { PageContainer } from '@/components/ui/page-container'
import { PageTitle } from '@/components/ui/page-title'
import { EmptyState } from '@/components/ui/empty-state'
import { Calendar } from 'lucide-react'

export default async function EventsPage() {
  const events = await getAllEvents({ data: {} })

  return (
    <PageContainer>
      <PageTitle>Running Events</PageTitle>

      {events.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No upcoming events found"
          description="Check back soon for new running events in Quebec City"
        />
      ) : (
        <ContentGrid>
          {events.map((event) => (
            <EventCard key={event.id} event={event} showClubName />
          ))}
        </ContentGrid>
      )}
    </PageContainer>
  )
}
