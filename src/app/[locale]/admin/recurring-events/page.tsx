'use client'

import { useState, useEffect } from 'react'
import { Link } from '@/i18n/navigation'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { useClubs } from '@/lib/hooks/use-clubs'
import {
  useRecurringEvents,
  useDeleteRecurringEvent,
} from '@/lib/hooks/use-recurring-events'
import { Button } from '@/components/ui/button'

export default function RecurringEventsListPage() {
  const { data: clubs, isLoading: clubsLoading } = useClubs()
  const [selectedClubId, setSelectedClubId] = useState<string>('')
  const { mutate: deleteRecurringEvent } = useDeleteRecurringEvent()

  // Set first club as default when clubs load
  useEffect(() => {
    if (clubs && clubs.length > 0 && !selectedClubId) {
      setSelectedClubId(clubs[0].id)
    }
  }, [clubs, selectedClubId])

  const { data: events, isLoading: eventsLoading } = useRecurringEvents(
    selectedClubId || ''
  )

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteRecurringEvent(id)
    }
  }

  if (clubsLoading) {
    return <div>Loading clubs...</div>
  }

  if (!clubs || clubs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">
          No clubs found. Please create a club first.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary">
            Recurring Events
          </h1>
          <p className="text-text-secondary mt-2">
            Manage repeating event patterns for your clubs
          </p>
        </div>
        <Link href="/admin/recurring-events/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Pattern
          </Button>
        </Link>
      </div>

      {/* Club Selector */}
      <div className="mb-6">
        <label
          htmlFor="club-select"
          className="block text-sm font-medium text-text-primary mb-2"
        >
          Club
        </label>
        <select
          id="club-select"
          value={selectedClubId}
          onChange={(e) => setSelectedClubId(e.target.value)}
          className="border border-border rounded-md px-3 py-2 bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-focus"
        >
          {clubs.map((club) => (
            <option key={club.id} value={club.id}>
              {club.name}
            </option>
          ))}
        </select>
      </div>

      {/* Events List */}
      {eventsLoading ? (
        <div>Loading events...</div>
      ) : events && events.length > 0 ? (
        <div className="bg-surface rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-variant border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Event Pattern
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-surface-variant">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-primary">
                          {event.title}
                        </div>
                        {event.description && (
                          <div className="text-sm text-text-secondary truncate max-w-xs">
                            {event.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-text-secondary truncate max-w-xs">
                        {event.address}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {event.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
                          Paused
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link href={`/admin/recurring-events/${event.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="w-3 h-3" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(event.id, event.title)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-surface rounded-lg border border-border p-8 text-center">
          <p className="text-text-secondary mb-4">
            No recurring events for this club yet
          </p>
          <Link href="/admin/recurring-events/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create First Pattern
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
