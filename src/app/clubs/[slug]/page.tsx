import { EventCard } from '@/components/events/event-card'
import { Link } from '@/components/ui/link'
import { getClubBySlug } from '@/lib/services/clubs'
import type { PageProps } from '@/lib/types/next'
import { Calendar } from 'lucide-react'
import { notFound } from 'next/navigation'

export type ClubPageProps = PageProps<{ slug: string }>

export default async function ClubPage({ params }: ClubPageProps) {
  const club = await getClubBySlug(await params)

  if (!club) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            href="/clubs"
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            ← Back to All Clubs
          </Link>
        </div>

        {/* Club Header */}
        <div className="bg-white rounded-xl shadow-sm border mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-12">
            <div className="max-w-3xl">
              <h1 className="text-5xl font-bold text-gray-900 mb-6">
                {club.name}
              </h1>
              {club.description && (
                <p className="text-xl text-gray-700 leading-relaxed mb-6">
                  {club.description}
                </p>
              )}

              {/* Social Links */}
              <div className="flex items-center gap-3 flex-wrap">
                {club.website && (
                  <Link
                    href={club.website}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    🌐 Website
                  </Link>
                )}
                {club.instagram && (
                  <span className="text-gray-700">📸 {club.instagram}</span>
                )}
                {club.facebook && (
                  <span className="text-gray-700">👥 Facebook</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Events Section */}
        <div className="bg-white rounded-xl shadow-sm border p-8">
          <div className="flex items-center gap-3 mb-8">
            <Calendar className="h-8 w-8 text-blue-600" />
            <h2 className="text-3xl font-bold text-gray-900">
              Upcoming Events (Next 7 Days)
            </h2>
          </div>

          {club.events && club.events.length > 0 ? (
            <div className="grid gap-6">
              {club.events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                No Upcoming Events
              </h3>
              <p className="text-gray-500">
                This club doesn&apos;t have any events scheduled for the next 7
                days.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
