'use client'

import { useClubs } from '@/lib/hooks/use-clubs'
import { ClubCard } from '@/components/clubs/club-card'

export default function Home() {
  const { data: clubs, isLoading } = useClubs()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Discover Run Clubs in Quebec City
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Find your running community and join exciting runs throughout the
          city. Connect with fellow runners and explore new routes together.
        </p>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Featured Run Clubs
        </h2>
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Loading clubs...</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {clubs?.map((club) => (
              <ClubCard key={club.id} club={club} />
            ))}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Map View
          </h2>
          <p className="text-gray-600 mb-4">
            Explore run clubs and upcoming events on an interactive map of
            Quebec City.
          </p>
          <div className="h-48 bg-gray-200 rounded-md flex items-center justify-center">
            <span className="text-gray-500">Map coming soon</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Calendar View
          </h2>
          <p className="text-gray-600 mb-4">
            Browse all upcoming runs and events in a convenient calendar format.
          </p>
          <div className="h-48 bg-gray-200 rounded-md flex items-center justify-center">
            <span className="text-gray-500">Calendar coming soon</span>
          </div>
        </div>
      </div>
    </div>
  )
}
