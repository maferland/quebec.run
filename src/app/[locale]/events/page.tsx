import { getTranslations } from 'next-intl/server'
import { getEventLocations } from '@/lib/services/events'
import { EventLocationCard } from '@/components/events/event-location-card'
import { OverrideEventCard } from '@/components/events/override-event-card'
import { EventFilters } from '@/components/events/event-filters'
import { EventMap } from '@/components/map/event-map'
import { MobileMapButton } from '@/components/events/mobile-map-button'
import { LoadMoreList } from '@/components/ui/load-more-list'
import { PageContainer } from '@/components/ui/page-container'
import { PageTitle } from '@/components/ui/page-title'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
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

  const { buckets, overrides, facetCounts } = await getEventLocations({
    data: query,
  })
  const mapEvents = buckets.map((bucket) => bucket.next)
  const items = [
    ...buckets.map((bucket) => ({
      type: 'bucket' as const,
      sortDate: bucket.next.date,
      key: bucket.key,
      data: bucket,
    })),
    ...overrides.map((event) => ({
      type: 'override' as const,
      sortDate: event.date,
      key: `override-${event.id}`,
      data: event,
    })),
  ].sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime())

  if (items.length === 0) {
    return (
      <PageContainer>
        <PageTitle>{t('title')}</PageTitle>
        <EventFilters facetCounts={facetCounts} />
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
        <MobileMapButton events={mapEvents} />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageTitle>{t('title')}</PageTitle>

      <EventFilters facetCounts={facetCounts} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[3fr_2fr]">
        <section>
          <LoadMoreList initial={6} step={6} className="flex flex-col gap-4">
            {items.map((item) =>
              item.type === 'bucket' ? (
                <EventLocationCard key={item.key} location={item.data} />
              ) : (
                <OverrideEventCard key={item.key} event={item.data} />
              )
            )}
          </LoadMoreList>
        </section>

        <aside className="hidden lg:block lg:sticky lg:top-6 lg:self-start">
          <h2 className="sr-only">{t('map.title')}</h2>
          <EventMap events={mapEvents} />
        </aside>
      </div>

      <MobileMapButton events={mapEvents} />
    </PageContainer>
  )
}
