'use client'

import { useUpcomingEvents } from '@/lib/hooks/use-events'
import { format } from 'date-fns'

export default function CalendarPage() {
  const { data: events = [], isLoading } = useUpcomingEvents()

  const groupedEvents = events.reduce(
    (groups, event) => {
      const date = format(new Date(event.date), 'yyyy-MM-dd')
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(event)
      return groups
    },
    {} as Record<string, typeof events>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Upcoming Events Calendar
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Browse all scheduled events from Quebec City running clubs.
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Loading events...</p>
          </div>
        ) : Object.keys(groupedEvents).length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No upcoming events scheduled.
            </p>
          </div>
        ) : (
          Object.entries(groupedEvents).map(([date, dayEvents]) => (
            <div key={date} className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 border-b pb-2">
                {format(new Date(date), 'EEEE, MMMM dd, yyyy')}
              </h2>
              <div className="grid gap-4">
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    className="bg-white p-6 rounded-lg shadow-md"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">
                          {event.title}
                        </h3>
                        <p className="text-blue-600 font-medium">
                          {event.club.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">
                          {event.time}
                        </p>
                        {event.distance && (
                          <p className="text-sm text-gray-600">
                            {event.distance}
                          </p>
                        )}
                      </div>
                    </div>

                    {event.description && (
                      <p className="text-gray-600 mb-3">{event.description}</p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <span>📍 {event.address}</span>
                      {event.pace && <span>⏱️ {event.pace}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
