import { getUpcomingRuns } from '@/lib/runs'
import { format } from 'date-fns'

export default async function CalendarPage() {
  const runs = await getUpcomingRuns()

  const groupedRuns = runs.reduce((groups, run) => {
    const date = format(new Date(run.date), 'yyyy-MM-dd')
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(run)
    return groups
  }, {} as Record<string, typeof runs>)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Upcoming Runs Calendar
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Browse all scheduled runs and events from Quebec City run clubs.
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        {Object.keys(groupedRuns).length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No upcoming runs scheduled.</p>
          </div>
        ) : (
          Object.entries(groupedRuns).map(([date, dayRuns]) => (
            <div key={date} className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 border-b pb-2">
                {format(new Date(date), 'EEEE, MMMM dd, yyyy')}
              </h2>
              <div className="grid gap-4">
                {dayRuns.map((run) => (
                  <div key={run.id} className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">
                          {run.title}
                        </h3>
                        <p className="text-blue-600 font-medium">{run.club.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">{run.time}</p>
                        {run.distance && (
                          <p className="text-sm text-gray-600">{run.distance}</p>
                        )}
                      </div>
                    </div>
                    
                    {run.description && (
                      <p className="text-gray-600 mb-3">{run.description}</p>
                    )}
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <span>📍 {run.address}</span>
                      {run.pace && <span>⏱️ {run.pace}</span>}
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