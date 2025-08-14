'use client'

import { useClubs } from '@/lib/hooks/use-clubs'
import { format } from 'date-fns'

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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clubs?.map((club) => (
              <div key={club.id} className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {club.name}
                </h3>
                <p className="text-gray-600 mb-3">{club.description}</p>
                <p className="text-sm text-gray-500 mb-4">{club.address}</p>

                {club.upcomingRuns && club.upcomingRuns.length > 0 && (
                  <div className="border-t pt-3">
                    <h4 className="font-medium text-gray-900 mb-2">
                      Upcoming runs:
                    </h4>
                    {club.upcomingRuns.map((run) => (
                      <div key={run.id} className="text-sm text-gray-600 mb-1">
                        <strong>{run.title}</strong> -{' '}
                        {format(new Date(run.date), 'MMM dd, yyyy')} at{' '}
                        {run.time}
                      </div>
                    ))}
                  </div>
                )}

                {club.website && (
                  <a
                    href={club.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-3 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Visit website →
                  </a>
                )}
              </div>
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
