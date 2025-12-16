'use client'

import { useTranslations } from 'next-intl'
import { useClubs } from '@/lib/hooks/use-clubs'
import { useUpcomingEvents } from '@/lib/hooks/use-events'
import { ClubCard } from '@/components/clubs/club-card'
import { Button } from '@/components/ui/button'
import { ContentGrid } from '@/components/ui/content-grid'
import { LoadingGrid, LoadingCard } from '@/components/ui/loading-card'
import { EventMap } from '@/components/map/event-map'
import { MapPin, Search, Filter, Calendar } from 'lucide-react'
import { Link } from '@/i18n/navigation'

export default function Home() {
  const t = useTranslations('home')
  const { data: clubs, isLoading: clubsLoading } = useClubs()
  const { data: events, isLoading: eventsLoading } = useUpcomingEvents()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-heading font-bold text-primary mb-6">
                {t('hero.title')}
              </h1>
              <p className="text-xl text-accent mb-8 font-body leading-relaxed">
                {t('hero.description')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/events">
                  <Button size="lg" variant="primary">
                    {t('hero.findEvents')}
                  </Button>
                </Link>
                <Link href="/clubs">
                  <Button size="lg" variant="outline-accent">
                    {t('hero.browseClubs')}
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              {eventsLoading ? (
                <div className="aspect-square bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl animate-pulse" />
              ) : (
                <EventMap events={events || []} />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-12 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-heading font-bold text-primary text-center mb-8">
              {t('search.title')}
            </h2>
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-accent"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder={t('search.placeholder')}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary font-body"
                  />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline-accent">
                    <Filter size={18} className="mr-2" />
                    {t('search.filters')}
                  </Button>
                  <Button variant="secondary">
                    {t('search.searchButton')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Clubs Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-heading font-bold text-primary">
              {t('clubs.title')}
            </h2>
            <Link href="/clubs">
              <Button variant="outline-primary">{t('clubs.viewAll')}</Button>
            </Link>
          </div>

          {clubsLoading ? (
            <LoadingGrid count={6}>
              <LoadingCard />
            </LoadingGrid>
          ) : (
            <ContentGrid>
              {clubs?.slice(0, 6).map((club) => (
                <ClubCard key={club.id} club={club} />
              ))}
            </ContentGrid>
          )}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-16 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-8">
              <div className="flex items-center mb-4">
                <Calendar className="text-primary mr-3" size={32} />
                <h3 className="text-2xl font-heading font-bold text-primary">
                  {t('quickActions.events.title')}
                </h3>
              </div>
              <p className="text-accent font-body mb-6">
                {t('quickActions.events.description')}
              </p>
              <Link href="/events">
                <Button variant="primary">
                  {t('quickActions.events.button')}
                </Button>
              </Link>
            </div>

            <div className="bg-gradient-to-br from-secondary/5 to-secondary/10 rounded-2xl p-8">
              <div className="flex items-center mb-4">
                <MapPin className="text-secondary mr-3" size={32} />
                <h3 className="text-2xl font-heading font-bold text-secondary">
                  {t('quickActions.routes.title')}
                </h3>
              </div>
              <p className="text-accent font-body mb-6">
                {t('quickActions.routes.description')}
              </p>
              <Link href="/calendar">
                <Button variant="secondary">
                  {t('quickActions.routes.button')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
