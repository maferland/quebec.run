'use client'

import { useState } from 'react'
import { useFormWithSchema } from '@/lib/form/use-form-with-schema'
import { clubCreateSchema, type ClubWithEvents } from '@/lib/schemas'
import {
  useCreateClub,
  useUpdateClub,
  useDeleteClub,
} from '@/lib/hooks/use-clubs'
import { FormInput } from '@/components/ui/form-input'
import { FormTextarea } from '@/components/ui/form-textarea'
import { FormSelect } from '@/components/ui/form-select'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Save, Trash2 } from 'lucide-react'
import { z } from 'zod'
import { formatDistanceToNow } from 'date-fns'

type ClubFormData = z.infer<typeof clubCreateSchema>

interface ClubFormProps {
  mode: 'create' | 'edit'
  initialData?: ClubWithEvents
  onSuccess?: (club: ClubWithEvents) => void
}

export function ClubForm({ mode, initialData, onSuccess }: ClubFormProps) {
  const t = useTranslations('forms')
  const tActions = useTranslations('forms.actions')
  const tClub = useTranslations('forms.club')
  const router = useRouter()

  const createMutation = useCreateClub()
  const updateMutation = useUpdateClub()
  const deleteMutation = useDeleteClub()

  const form = useFormWithSchema({
    schema: clubCreateSchema,
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      website: initialData?.website || '',
      instagram: initialData?.instagram || '',
      facebook: initialData?.facebook || '',
      language: initialData?.language || 'both',
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form

  const [stravaSlug, setStravaSlug] = useState('')
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  const handlePreviewStrava = async () => {
    setIsPreviewing(true)
    try {
      const response = await fetch(
        `/api/admin/strava/preview?slug=${stravaSlug}`
      )
      if (!response.ok) throw new Error('Preview failed')
      const data = await response.json()
      // TODO: Show preview modal (Task 16)
      console.log('Preview data:', data)
    } catch (error) {
      console.error('Preview error:', error)
      alert('Failed to preview Strava club')
    } finally {
      setIsPreviewing(false)
    }
  }

  const handleSyncStrava = async () => {
    if (!initialData?.id) return
    setIsSyncing(true)
    try {
      const response = await fetch(
        `/api/admin/clubs/${initialData.id}/sync-strava`,
        {
          method: 'POST',
        }
      )
      if (!response.ok) throw new Error('Sync failed')
      const data = await response.json()
      alert(
        `Synced! Added: ${data.summary.eventsAdded}, Updated: ${data.summary.eventsUpdated}`
      )
      window.location.reload()
    } catch (error) {
      console.error('Sync error:', error)
      alert('Failed to sync Strava club')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleUnlinkStrava = async () => {
    if (!initialData?.id) return
    if (
      !confirm(
        'Unlink from Strava? This will delete all Strava-sourced events.'
      )
    )
      return

    try {
      const response = await fetch(
        `/api/admin/clubs/${initialData.id}/unlink-strava`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deleteEvents: true }),
        }
      )
      if (!response.ok) throw new Error('Unlink failed')
      alert('Club unlinked from Strava')
      window.location.reload()
    } catch (error) {
      console.error('Unlink error:', error)
      alert('Failed to unlink Strava club')
    }
  }

  const handleFormSubmit = handleSubmit(async (data: ClubFormData) => {
    try {
      if (mode === 'create') {
        const newClub = await createMutation.mutateAsync(data)
        onSuccess?.(newClub)
      } else if (mode === 'edit' && initialData) {
        const updatedClub = await updateMutation.mutateAsync({
          id: initialData.id,
          data: { ...data, id: initialData.id },
        })
        onSuccess?.(updatedClub)
      }
    } catch (error) {
      console.error('Form submission error:', error)
    }
  })

  const handleDelete = async () => {
    if (!initialData || mode !== 'edit') return

    const confirmed = confirm(t('admin.clubs.confirmDelete'))
    if (!confirmed) return

    try {
      await deleteMutation.mutateAsync(initialData.id)
      router.push('/admin/clubs')
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  const languageOptions = [
    { value: 'fr', label: 'Français' },
    { value: 'en', label: 'English' },
    { value: 'both', label: 'Bilingue / Bilingual' },
  ]

  const isLoading =
    isSubmitting || createMutation.isPending || updateMutation.isPending
  const isDeleting = deleteMutation.isPending

  return (
    <div className="max-w-2xl">
      <form
        onSubmit={handleFormSubmit}
        className="bg-surface rounded-lg border border-border p-6"
      >
        <div className="space-y-6">
          <FormInput
            register={register}
            name="name"
            label={tClub('name')}
            error={errors.name}
            required
            placeholder="e.g. 6AM Club"
          />

          <FormTextarea
            register={register}
            name="description"
            label={tClub('description')}
            error={errors.description}
            rows={4}
            placeholder="Brief description of the club..."
          />

          <FormSelect
            register={register}
            name="language"
            label={tClub('language')}
            error={errors.language}
            options={languageOptions}
          />

          <FormInput
            register={register}
            name="website"
            label={tClub('website')}
            error={errors.website}
            type="url"
            placeholder="https://example.com"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              register={register}
              name="instagram"
              label={tClub('instagram')}
              error={errors.instagram}
              placeholder="@username"
            />

            <FormInput
              register={register}
              name="facebook"
              label={tClub('facebook')}
              error={errors.facebook}
              placeholder="Page name or URL"
            />
          </div>

          {/* Strava Integration - only in edit mode */}
          {mode === 'edit' && (
            <div className="space-y-4 rounded-lg border border-border p-4">
              <h3 className="text-lg font-medium">Strava Integration</h3>

              {initialData?.stravaSlug ? (
                // Linked state
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Linked to Strava</p>
                      <p className="text-sm text-muted-foreground">
                        {initialData.stravaSlug}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSyncStrava}
                      disabled={isSyncing}
                    >
                      {isSyncing ? 'Syncing...' : 'Sync Now'}
                    </Button>
                  </div>

                  {initialData.lastSyncStatus === 'success' &&
                    initialData.lastSynced && (
                      <p className="text-sm text-green-600">
                        ✅ Last synced{' '}
                        {formatDistanceToNow(new Date(initialData.lastSynced))}{' '}
                        ago
                      </p>
                    )}

                  {initialData.lastSyncStatus === 'failed' && (
                    <div className="rounded bg-red-50 p-3">
                      <p className="text-sm font-medium text-red-800">
                        ⚠️ Last sync failed
                      </p>
                      {initialData.lastSyncError && (
                        <p className="text-sm text-red-600">
                          {initialData.lastSyncError}
                        </p>
                      )}
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleUnlinkStrava}
                  >
                    Unlink Strava
                  </Button>
                </div>
              ) : (
                // Unlinked state
                <div className="space-y-3">
                  <div>
                    <label
                      htmlFor="stravaSlug"
                      className="block text-sm font-medium"
                    >
                      Strava Club Slug
                    </label>
                    <input
                      id="stravaSlug"
                      type="text"
                      placeholder="club-de-course-quebec-123456"
                      value={stravaSlug}
                      onChange={(e) => setStravaSlug(e.target.value)}
                      className="mt-1 block w-full rounded border border-border p-2"
                    />
                    <p className="mt-1 text-sm text-muted-foreground">
                      Find slug in Strava club URL: strava.com/clubs/[slug]
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePreviewStrava}
                    disabled={!stravaSlug || isPreviewing}
                  >
                    {isPreviewing ? 'Loading...' : 'Preview Club Data'}
                  </Button>
                </div>
              )}
            </div>
          )}
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
              onClick={() => router.push('/admin/clubs')}
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
