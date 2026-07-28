'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { recurringEventCreateSchema } from '@/lib/schemas'
import {
  useCreateRecurringEvent,
  useUpdateRecurringEvent,
} from '@/lib/hooks/use-recurring-events'
import {
  buildRRuleString,
  parseRRuleToForm,
  type RecurrenceFormState,
} from '@/lib/utils/rrule-builder'
import { RecurrenceBuilder } from './recurrence-builder'
import { OccurrencePreview } from './occurrence-preview'
import { FormInput } from '@/components/ui/form-input'
import { FormTextarea } from '@/components/ui/form-textarea'
import { Button } from '@/components/ui/button'
import type { RecurringEvent } from '@client'

// Partial schema for form fields only (excludes schedulePattern, clubId, timezone, isActive)
const formFieldsSchema = recurringEventCreateSchema.pick({
  title: true,
  description: true,
  address: true,
  distance: true,
  pace: true,
})

interface RecurringEventFormProps {
  mode: 'create' | 'edit'
  clubId: string
  initialData?: RecurringEvent
  onSuccess?: () => void
}

export function RecurringEventForm({
  mode,
  clubId,
  initialData,
  onSuccess,
}: RecurringEventFormProps) {
  const [recurrenceError, setRecurrenceError] = useState<string | null>(null)
  const [recurrence, setRecurrence] = useState<RecurrenceFormState>(
    initialData
      ? parseRRuleToForm(initialData.schedulePattern)
      : {
          frequency: 'weekly',
          interval: 1,
          byweekday: [],
          time: '18:00',
          until: null,
        }
  )

  const handleRecurrenceChange = (newRecurrence: RecurrenceFormState) => {
    setRecurrence(newRecurrence)
    setRecurrenceError(null) // Clear error when user changes recurrence
  }

  const createMutation = useCreateRecurringEvent()
  const updateMutation = useUpdateRecurringEvent()

  const form = useForm({
    resolver: zodResolver(formFieldsSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      address: initialData?.address || '',
      distance: initialData?.distance || '',
      pace: initialData?.pace || '',
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form

  const schedulePattern = buildRRuleString(recurrence)

  const onSubmit = handleSubmit(async (data) => {
    // Validate recurrence pattern
    if (
      recurrence.frequency !== 'monthly' &&
      recurrence.byweekday.length === 0
    ) {
      setRecurrenceError('Please select at least one day of the week')
      return
    }
    setRecurrenceError(null)

    try {
      const payload = {
        ...data,
        schedulePattern,
        clubId,
        timezone: 'America/Toronto',
        isActive: true,
      }

      if (mode === 'create') {
        await createMutation.mutateAsync(payload)
      } else if (initialData) {
        await updateMutation.mutateAsync({
          ...payload,
          id: initialData.id,
        })
      }

      onSuccess?.()
    } catch (error) {
      console.error('Form submission error:', error)
    }
  })

  const isLoading =
    isSubmitting || createMutation.isPending || updateMutation.isPending

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <FormInput
        register={register}
        name="title"
        label="Title"
        error={errors.title}
        required
      />

      <FormTextarea
        register={register}
        name="description"
        label="Description"
        error={errors.description}
        rows={3}
      />

      <FormInput
        register={register}
        name="address"
        label="Address"
        error={errors.address}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormInput
          register={register}
          name="distance"
          label="Distance"
          error={errors.distance}
          placeholder="e.g., 5km"
        />

        <FormInput
          register={register}
          name="pace"
          label="Pace"
          error={errors.pace}
          placeholder="e.g., Easy, 5:30/km"
        />
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium mb-4">Recurrence Pattern</h3>
        <RecurrenceBuilder
          value={recurrence}
          onChange={handleRecurrenceChange}
        />
        {recurrenceError && (
          <p className="mt-2 text-sm text-red-600">{recurrenceError}</p>
        )}
      </div>

      <div className="border-t pt-6">
        <OccurrencePreview pattern={schedulePattern} count={5} />
      </div>

      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? mode === 'create'
              ? 'Creating...'
              : 'Updating...'
            : mode === 'create'
              ? 'Create'
              : 'Update'}
        </Button>
      </div>
    </form>
  )
}
