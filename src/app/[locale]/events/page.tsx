import { getTranslations } from 'next-intl/server'
import { getAllEvents } from '@/lib/services/events'
import { getAllClubs } from '@/lib/services/clubs'
import { EventCard } from '@/components/events/event-card'
import { EventFilters } from '@/components/events/event-filters'
import { ContentGrid } from '@/components/ui/content-grid'
import { PageContainer } from '@/components/ui/page-container'
import { PageTitle } from '@/components/ui/page-title'
import { EmptyState } from '@/components/ui/empty-state'
import { Calendar } from 'lucide-react'

type EventsPageProps = {
  searchParams: Promise<{
    search?: string
    clubId?: string
    dateFrom?: string
    dateTo?: string
  }>
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const params = await searchParams
  const t = await getTranslations('events')
  const clubs = await getAllClubs({ data: {} })
  const events = await getAllEvents({ data: params })

  return (
    <PageContainer>
      <PageTitle>{t('title')}</PageTitle>

      <EventFilters
        clubs={clubs.map((club) => ({ id: club.id, name: club.name }))}
        showDateRange={true}
      />

      {events.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={t('empty.noResults')}
          description={t('empty.tryAdjusting')}
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
