import { getTranslations } from 'next-intl/server'
import { ClubCard } from '@/components/clubs/club-card'
import { Button } from '@/components/ui/button'
import { ContentGrid } from '@/components/ui/content-grid'
import { EventMap } from '@/components/map/event-map'
import { HomeSearch } from '@/components/home/home-search'
import { Calendar } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { getAllClubs } from '@/lib/services/clubs'
import { getEventLocations } from '@/lib/services/events'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const t = await getTranslations('home')

  const [clubs, listing] = await Promise.all([
    getAllClubs({ data: { limit: 6, offset: 0 } }),
    getEventLocations({ data: {} }),
  ])
  const events = listing.buckets.map((bucket) => bucket.next)

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-3xl md:text-5xl font-heading font-bold text-primary mb-6">
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
              <div className="mt-8 hidden md:block">
                <HomeSearch />
              </div>
            </div>
            <div className="relative">
              <EventMap events={events} />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-primary">
              {t('clubs.title')}
            </h2>
            <Link href="/clubs" className="self-start sm:self-auto">
              <Button variant="outline-primary">{t('clubs.viewAll')}</Button>
            </Link>
          </div>

          <ContentGrid>
            {clubs.map((club) => (
              <ClubCard key={club.id} club={club} />
            ))}
          </ContentGrid>
        </div>
      </section>

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

            <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-8">
              <div className="flex items-center mb-4">
                <Calendar className="text-primary mr-3" size={32} />
                <h3 className="text-2xl font-heading font-bold text-primary">
                  {t('quickActions.routes.title')}
                </h3>
              </div>
              <p className="text-accent font-body mb-6">
                {t('quickActions.routes.description')}
              </p>
              <Link href="/calendar">
                <Button variant="primary">
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
