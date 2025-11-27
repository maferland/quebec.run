'use client'

import { useFormWithSchema } from '@/lib/form/use-form-with-schema'
import {
  eventCreateSchema,
  type EventWithClub,
  type Event,
} from '@/lib/schemas'
import {
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
} from '@/lib/hooks/use-events'
import { FormInput } from '@/components/ui/form-input'
import { FormTextarea } from '@/components/ui/form-textarea'
import { FormSelect } from '@/components/ui/form-select'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Save, Trash2 } from 'lucide-react'
import { z } from 'zod'

type EventFormData = Event & {
  club: {
    id: string
    name: string
  }
}

type EventFormInput = z.infer<typeof eventCreateSchema>

interface EventFormProps {
  mode: 'create' | 'edit'
  initialData?: EventFormData
  clubs: Array<{ id: string; name: string }>
  onSuccess?: (event: EventWithClub) => void
}

export function EventForm({
  mode,
  initialData,
  clubs,
  onSuccess,
}: EventFormProps) {
  const t = useTranslations('forms')
  const tActions = useTranslations('forms.actions')
  const tEvent = useTranslations('forms.event')
  const router = useRouter()

  const createMutation = useCreateEvent()
  const updateMutation = useUpdateEvent()
  const deleteMutation = useDeleteEvent()

  const form = useFormWithSchema({
    schema: eventCreateSchema,
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      date: initialData?.date
        ? initialData.date.toISOString().split('T')[0]
        : '',
      time: initialData?.time || '',
      address: initialData?.address || '',
      distance: initialData?.distance || '',
      pace: initialData?.pace || '',
      clubId: initialData?.clubId || clubs[0]?.id || '',
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form

  const handleFormSubmit = handleSubmit(async (data: EventFormInput) => {
    try {
      if (mode === 'create') {
        const newEvent = await createMutation.mutateAsync(data)
        onSuccess?.(newEvent)
      } else if (mode === 'edit' && initialData) {
        const updatedEvent = await updateMutation.mutateAsync({
          id: initialData.id,
          data: { ...data, id: initialData.id },
        })
        onSuccess?.(updatedEvent)
      }
    } catch (error) {
      console.error('Form submission error:', error)
    }
  })

  const handleDelete = async () => {
    if (!initialData || mode !== 'edit') return

    const confirmed = confirm(t('admin.events.confirmDelete'))
    if (!confirmed) return

    try {
      await deleteMutation.mutateAsync(initialData.id)
      router.push('/admin/events')
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  const clubOptions = clubs.map((club) => ({
    value: club.id,
    label: club.name,
  }))

  const isLoading =
    isSubmitting || createMutation.isPending || updateMutation.isPending
  const isDeleting = deleteMutation.isPending

  return (
    <div className="max-w-2xl">
      <form
        onSubmit={handleFormSubmit}
        noValidate
        className="bg-surface rounded-lg border border-border p-6"
      >
        <div className="space-y-6">
          <FormInput
            register={register}
            name="title"
            label={tEvent('title')}
            error={errors.title}
            required
            placeholder="e.g. Morning Run"
          />

          <FormTextarea
            register={register}
            name="description"
            label={tEvent('description')}
            error={errors.description}
            rows={4}
            placeholder="Brief description of the event..."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              register={register}
              name="date"
              label={tEvent('date')}
              error={errors.date}
              type="date"
              required
            />

            <FormInput
              register={register}
              name="time"
              label={tEvent('time')}
              error={errors.time}
              type="time"
              required
            />
          </div>

          <FormSelect
            register={register}
            name="clubId"
            label={tEvent('club')}
            error={errors.clubId}
            options={clubOptions}
            required
          />

          <FormInput
            register={register}
            name="address"
            label={tEvent('address')}
            error={errors.address}
            required
            placeholder="Meeting location"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              register={register}
              name="distance"
              label={tEvent('distance')}
              error={errors.distance}
              placeholder="e.g. 5km"
            />

            <FormInput
              register={register}
              name="pace"
              label={tEvent('pace')}
              error={errors.pace}
              placeholder="e.g. 5:00/km"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between mt-8 pt-6 border-t border-border">
          {mode === 'edit' && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isDeleting ? tActions('deleting') : tActions('delete')}
            </Button>
          )}

          <div className="flex space-x-4 ml-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/admin/events')}
              disabled={isLoading}
            >
              {tActions('cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              <Save className="w-4 h-4 mr-2" />
              {isLoading
                ? mode === 'create'
                  ? tActions('creating')
                  : tActions('updating')
                : mode === 'create'
                  ? tActions('create')
                  : tActions('save')}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
