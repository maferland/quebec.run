'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { useRecurringEvent } from '@/lib/hooks/use-recurring-events'
import { RecurringEventForm } from '@/components/admin/recurring-event-form'

export default function EditRecurringEventPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const [id, setId] = useState<string | null>(null)

  useEffect(() => {
    params.then((resolved) => setId(resolved.id))
  }, [params])

  const { data: event, isLoading, error } = useRecurringEvent(id || '')

  const handleSuccess = () => {
    router.push('/admin/recurring-events')
    router.refresh()
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (error || !event) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">Recurring event not found</p>
        <Link
          href="/admin/recurring-events"
          className="text-primary hover:underline mt-4 inline-block"
        >
          Back to Recurring Events
        </Link>
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
          Edit Recurring Event
        </h1>
        <p className="text-text-secondary mt-2">
          Update the repeating event pattern
        </p>
      </div>

      {/* Form */}
      <RecurringEventForm
        mode="edit"
        clubId={event.clubId}
        initialData={event}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
