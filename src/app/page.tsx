'use client'

import { useClubs } from '@/lib/hooks/use-clubs'
import { ClubCard } from '@/components/clubs/club-card'
import { Button } from '@/components/ui/button'
import { ContentGrid } from '@/components/ui/content-grid'
import { LoadingGrid, LoadingCard } from '@/components/ui/loading-card'
import { MapPin, Search, Filter, Calendar } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  const { data: clubs, isLoading: clubsLoading } = useClubs()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-heading font-bold text-primary mb-6">
                Discover Running in Quebec City
              </h1>
              <p className="text-xl text-accent mb-8 font-body leading-relaxed">
                Connect with local running clubs, find upcoming events, and
                explore scenic routes through Quebec City&apos;s historic
                neighborhoods.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/events">
                  <Button size="lg" variant="primary">
                    Find Events Near You
                  </Button>
                </Link>
                <Link href="/clubs">
                  <Button size="lg" variant="outline-accent">
                    Browse Running Clubs
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-8 flex items-center justify-center">
                <div className="text-center">
                  <MapPin size={64} className="text-primary mx-auto mb-4" />
                  <h3 className="text-2xl font-heading font-semibold text-primary mb-2">
                    Interactive Map
                  </h3>
                  <p className="text-accent font-body">
                    Explore routes and locations across Quebec City
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
              Find Your Next Run
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
                    placeholder="Search events, clubs, or locations..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary font-body"
                  />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline-accent">
                    <Filter size={18} className="mr-2" />
                    Filters
                  </Button>
                  <Button variant="secondary">Search</Button>
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
              Featured Run Clubs
            </h2>
            <Link href="/clubs">
              <Button variant="outline-primary">View All Clubs</Button>
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
                  Upcoming Events
                </h3>
              </div>
              <p className="text-accent font-body mb-6">
                Don&apos;t miss out on the next group run. Check our calendar
                for all scheduled events and races.
              </p>
              <Link href="/events">
                <Button variant="primary">Browse Events</Button>
              </Link>
            </div>

            <div className="bg-gradient-to-br from-secondary/5 to-secondary/10 rounded-2xl p-8">
              <div className="flex items-center mb-4">
                <MapPin className="text-secondary mr-3" size={32} />
                <h3 className="text-2xl font-heading font-bold text-secondary">
                  Explore Routes
                </h3>
              </div>
              <p className="text-accent font-body mb-6">
                Discover scenic running routes throughout Quebec City, from Old
                Quebec to the Plains of Abraham.
              </p>
              <Link href="/calendar">
                <Button variant="secondary">View Calendar</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
