'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { useClubs } from '@/lib/hooks/use-clubs'
import { RecurringEventForm } from '@/components/admin/recurring-event-form'

export default function NewRecurringEventPage() {
  const router = useRouter()
  const { data: clubs, isLoading } = useClubs()
  const [selectedClubId, setSelectedClubId] = useState<string>('')

  useEffect(() => {
    if (clubs && clubs.length > 0 && !selectedClubId) {
      setSelectedClubId(clubs[0].id)
    }
  }, [clubs, selectedClubId])

  const handleSuccess = () => {
    router.push('/admin/recurring-events')
    router.refresh()
  }

  if (isLoading) {
    return <div>Loading...</div>
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
      {/* Back Link */}
      <div className="mb-4">
        <Link
          href="/admin/recurring-events"
          className="flex items-center text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Recurring Events
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-primary">
          Create Recurring Event
        </h1>
        <p className="text-text-secondary mt-2">
          Set up a new repeating event pattern
        </p>
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

      {/* Form */}
      {selectedClubId && (
        <RecurringEventForm
          mode="create"
          clubId={selectedClubId}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}
