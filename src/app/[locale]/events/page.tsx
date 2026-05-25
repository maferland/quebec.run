import { getTranslations } from 'next-intl/server'
import { getAllEvents } from '@/lib/services/events'
import { EventCard } from '@/components/events/event-card'
import { EventFilters } from '@/components/events/event-filters'
import { EventMap } from '@/components/map/event-map'
import { MobileMapButton } from '@/components/events/mobile-map-button'
import { LoadMoreList } from '@/components/ui/load-more-list'
import { PageContainer } from '@/components/ui/page-container'
import { PageTitle } from '@/components/ui/page-title'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
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
  const hasFilters = Boolean(
    query.search || query.pacePolicy || query.timeOfDay || query.weekend
  )

  const events = await getAllEvents({ data: query })

  if (events.length === 0) {
    return (
      <PageContainer>
        <PageTitle>{t('title')}</PageTitle>
        <EventFilters />
        <div className="flex min-h-[40vh] items-center justify-center">
          <EmptyState
            icon={Calendar}
            title={hasFilters ? t('empty.noResults') : t('empty.title')}
            description={
              hasFilters ? t('empty.tryAdjusting') : t('empty.description')
            }
            action={
              hasFilters ? (
                <Link href="/events">
                  <Button variant="outline-primary">
                    {t('filters.clearFilters')}
                  </Button>
                </Link>
              ) : null
            }
          />
        </div>
        <MobileMapButton events={events} />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageTitle>{t('title')}</PageTitle>

      <EventFilters />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[3fr_2fr]">
        <section>
          <LoadMoreList initial={3} step={6}>
            {Object.entries(groupEventsByDate(events)).map(
              ([date, dayEvents]) => (
                <section key={date} className="mb-8">
                  <h2 className="text-lg font-heading font-semibold text-text-secondary mb-4 flex items-center gap-2">
                    <Calendar aria-hidden="true" className="h-4 w-4" />
                    {date}
                  </h2>
                  <div className="flex flex-col gap-4">
                    {dayEvents.map((event) => (
                      <EventCard key={event.id} event={event} showClubName />
                    ))}
                  </div>
                </section>
              )
            )}
          </LoadMoreList>
        </section>

        <aside className="hidden lg:block lg:sticky lg:top-6 lg:self-start lg:mt-11">
          <h2 className="sr-only">{t('map.title')}</h2>
          <EventMap events={events} />
        </aside>
      </div>

      <MobileMapButton events={events} />
    </PageContainer>
  )
}
