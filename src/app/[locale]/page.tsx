'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useClubs } from '@/lib/hooks/use-clubs'
import { useEvents } from '@/lib/hooks/use-events'
import type { EventWithClub } from '@/lib/schemas'
import { ClubCard } from '@/components/clubs/club-card'
import { EventCard } from '@/components/events/event-card'
import { Button } from '@/components/ui/button'
import { ContentGrid } from '@/components/ui/content-grid'
import { LoadingGrid, LoadingCard } from '@/components/ui/loading-card'
import { MapPin, Search, Calendar } from 'lucide-react'
import { Link } from '@/i18n/navigation'

export default function Home() {
  const t = useTranslations('home')
  const { data: clubs, isLoading: clubsLoading } = useClubs()
  const [search, setSearch] = useState('')

  const { data: events, isLoading: eventsLoading } = useEvents({
    search,
    limit: 6,
  })

  const filteredClubs =
    clubs?.filter((club) =>
      club.name.toLowerCase().includes(search.toLowerCase())
    ) || []

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
              <div className="aspect-square bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-8 flex items-center justify-center">
                <div className="text-center">
                  <MapPin size={64} className="text-primary mx-auto mb-4" />
                  <h3 className="text-2xl font-heading font-semibold text-primary mb-2">
                    {t('hero.mapTitle')}
                  </h3>
                  <p className="text-accent font-body">
                    {t('hero.mapDescription')}
                  </p>
                </div>
              </div>
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
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t('search.placeholder')}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary font-body"
                  />
                </div>
                <Link href="/events">
                  <Button variant="secondary">{t('search.browseAll')}</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-heading font-bold text-primary">
              {t('events.title')}
              {events && events.length > 0 && (
                <span className="ml-2 text-text-secondary text-xl">
                  ({events.length} {t('events.count')})
                </span>
              )}
            </h2>
            <Link href="/events">
              <Button variant="outline-primary">{t('events.viewAll')}</Button>
            </Link>
          </div>

          {eventsLoading ? (
            <LoadingGrid count={6}>
              <LoadingCard />
            </LoadingGrid>
          ) : events && events.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-text-secondary">
                {search
                  ? t('events.noResults', { search })
                  : t('events.noEvents')}
              </p>
            </div>
          ) : (
            <ContentGrid>
              {events?.slice(0, 6).map((event: EventWithClub) => (
                <EventCard key={event.id} event={event} showClubName />
              ))}
            </ContentGrid>
          )}
        </div>
      </section>

      {/* Featured Clubs Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-heading font-bold text-primary">
              {t('clubs.title')}
              {filteredClubs && filteredClubs.length > 0 && (
                <span className="ml-2 text-text-secondary text-xl">
                  ({filteredClubs.length} {t('clubs.count')})
                </span>
              )}
            </h2>
            <Link href="/clubs">
              <Button variant="outline-primary">{t('clubs.viewAll')}</Button>
            </Link>
          </div>

          {clubsLoading ? (
            <LoadingGrid count={6}>
              <LoadingCard />
            </LoadingGrid>
          ) : filteredClubs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-text-secondary">
                {search ? t('clubs.noResults', { search }) : t('clubs.noClubs')}
              </p>
            </div>
          ) : (
            <ContentGrid>
              {filteredClubs.slice(0, 6).map((club) => (
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
