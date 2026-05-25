import { getTranslations } from 'next-intl/server'
import { getAllEvents } from '@/lib/services/events'
import { getAllClubs } from '@/lib/services/clubs'
import { EventCard } from '@/components/events/event-card'
import { EventFilters } from '@/components/events/event-filters'
import { EventMap } from '@/components/map/event-map'
import { ContentGrid } from '@/components/ui/content-grid'
import { LoadMoreList } from '@/components/ui/load-more-list'
import { PageContainer } from '@/components/ui/page-container'
import { PageTitle } from '@/components/ui/page-title'
import { EmptyState } from '@/components/ui/empty-state'
import { groupEventsByDate } from '@/lib/utils/date-formatting'
import { eventsQuerySchema } from '@/lib/schemas'
import { Calendar } from 'lucide-react'

export const dynamic = 'force-dynamic'

type EventsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const t = await getTranslations('events')
  const params = await searchParams
  const parsed = eventsQuerySchema.safeParse(params)
  const query = parsed.success ? parsed.data : {}
  const hasFilters = Boolean(query.search || query.clubSlug || query.pacePolicy)

  const [events, clubs] = await Promise.all([
    getAllEvents({ data: query }),
    getAllClubs({ data: {} }),
  ])

  return (
    <PageContainer>
      <PageTitle>{t('title')}</PageTitle>

      <EventFilters
        clubs={clubs.map((c) => ({ slug: c.slug, name: c.name }))}
      />

      {/* Map Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-heading font-bold text-primary mb-4">
          {t('map.title')}
        </h2>
        <EventMap events={events} />
      </section>

      {/* Event List Section */}
      <section>
        <h2 className="text-2xl font-heading font-bold text-primary mb-4">
          {t('list.title')}
        </h2>
        {events.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title={hasFilters ? t('empty.noResults') : t('empty.title')}
            description={
              hasFilters ? t('empty.tryAdjusting') : t('empty.description')
            }
          />
        ) : (
          <LoadMoreList initial={3} step={3}>
            {Object.entries(groupEventsByDate(events)).map(
              ([date, dayEvents]) => (
                <section key={date} className="mb-8">
                  <h3 className="text-lg font-heading font-semibold text-text-secondary mb-4 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {date}
                  </h3>
                  <ContentGrid>
                    {dayEvents.map((event) => (
                      <EventCard key={event.id} event={event} showClubName />
                    ))}
                  </ContentGrid>
                </section>
              )
            )}
          </LoadMoreList>
        )}
      </section>
    </PageContainer>
  )
}
