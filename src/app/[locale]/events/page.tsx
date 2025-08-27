import { getTranslations } from 'next-intl/server'
import { getAllEvents } from '@/lib/services/events'
import { EventCard } from '@/components/events/event-card'
import { ContentGrid } from '@/components/ui/content-grid'
import { PageContainer } from '@/components/ui/page-container'
import { PageTitle } from '@/components/ui/page-title'
import { EmptyState } from '@/components/ui/empty-state'
import { Calendar } from 'lucide-react'

export default async function EventsPage() {
  const t = await getTranslations('events')
  const events = await getAllEvents({ data: {} })

  return (
    <PageContainer>
      <PageTitle>{t('title')}</PageTitle>

      {events.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={t('empty.title')}
          description={t('empty.description')}
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
