'use client'

import { useState } from 'react'
import { useFormWithSchema } from '@/lib/form/use-form-with-schema'
import { clubCreateSchema, type ClubWithEvents } from '@/lib/schemas'
import {
  useCreateClub,
  useUpdateClub,
  useDeleteClub,
  useStravaSync,
} from '@/lib/hooks/use-clubs'
import { FormInput } from '@/components/ui/form-input'
import { FormTextarea } from '@/components/ui/form-textarea'
import { FormSelect } from '@/components/ui/form-select'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import {
  Save,
  Trash2,
  RefreshCw,
  CheckCircle,
  Lock,
  Unlink,
  AlertCircle,
} from 'lucide-react'
import { z } from 'zod'

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
  const stravaSyncMutation = useStravaSync()

  const [syncError, setSyncError] = useState<string | null>(null)
  const [syncSuccess, setSyncSuccess] = useState(false)
  const [showUnlinkDialog, setShowUnlinkDialog] = useState(false)

  const form = useFormWithSchema({
    schema: clubCreateSchema,
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      website: initialData?.website || '',
      instagram: initialData?.instagram || '',
      facebook: initialData?.facebook || '',
      language: initialData?.language || 'both',
      stravaClubId: initialData?.stravaClubId || null,
      stravaSlug: initialData?.stravaSlug || null,
      isManual: initialData?.isManual ?? true,
      lastSynced: initialData?.lastSynced || null,
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = form

  const isSynced = !!initialData?.stravaClubId

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

  const handleSync = async () => {
    const stravaSlug = watch('stravaSlug')
    if (!stravaSlug) return

    setSyncError(null)
    setSyncSuccess(false)

    try {
      // Check for duplicate stravaSlug (unless editing the same club)
      const existingClubRes = await fetch('/api/clubs')
      if (existingClubRes.ok) {
        const clubs = await existingClubRes.json()
        const duplicate = clubs.find(
          (c: { stravaSlug: string | null; id: string }) =>
            c.stravaSlug === stravaSlug && c.id !== initialData?.id
        )
        if (duplicate) {
          setSyncError(
            'A club with this Strava slug already exists. Please use a different slug or unlink the existing club.'
          )
          return
        }
      }

      const data = await stravaSyncMutation.mutateAsync(stravaSlug)

      // Update form fields with Strava data
      setValue('name', data.name)
      setValue('description', data.description || '')
      setValue('stravaClubId', data.id.toString())
      setValue('isManual', false)
      setValue('lastSynced', new Date())

      // Show success message
      setSyncSuccess(true)
      setTimeout(() => setSyncSuccess(false), 5000)
    } catch (error) {
      setSyncError(
        error instanceof Error ? error.message : 'Failed to sync from Strava'
      )
    }
  }

  const handleUnlink = () => {
    setValue('stravaClubId', null)
    setValue('stravaSlug', null)
    setValue('isManual', true)
    setValue('lastSynced', null)
    setShowUnlinkDialog(false)
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
          {/* Strava Integration Section */}
          <div className="border border-border rounded-lg p-4 bg-gray-50">
            <h3 className="text-sm font-semibold text-text-primary mb-3">
              Strava Integration
            </h3>

            {isSynced && (
              <div className="mb-3 flex items-center gap-2 text-sm text-green-700">
                <CheckCircle className="w-4 h-4" />
                <span>
                  Synced with Strava Club ID: {initialData?.stravaClubId}
                </span>
              </div>
            )}

            <FormInput
              register={register}
              name="stravaSlug"
              label="Strava Club ID"
              error={errors.stravaSlug}
              placeholder="e.g., fauxmouvement or 951639"
              disabled={isSynced}
            />
            {!isSynced && (
              <p className="mt-1 text-xs text-gray-600">
                Find this in your Strava club URL: strava.com/clubs/
                <strong>club-id</strong>
              </p>
            )}

            {syncError && (
              <div className="mt-2 text-sm text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {syncError}
              </div>
            )}

            {syncSuccess && (
              <div className="mt-2 text-sm text-green-700 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Successfully synced club data from Strava! Don&apos;t forget to
                save.
              </div>
            )}

            <div className="mt-3 flex gap-2">
              {!isSynced && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSync}
                  disabled={
                    stravaSyncMutation.isPending || !watch('stravaSlug')
                  }
                >
                  {stravaSyncMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Sync from Strava
                    </>
                  )}
                </Button>
              )}

              {isSynced && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowUnlinkDialog(true)}
                >
                  <Unlink className="w-4 h-4 mr-2" />
                  Unlink from Strava
                </Button>
              )}
            </div>
          </div>

          <FormInput
            register={register}
            name="name"
            label={tClub('name')}
            error={errors.name}
            required
            placeholder="e.g. 6AM Club"
            readOnly={isSynced}
            className={isSynced ? 'bg-gray-50 cursor-not-allowed' : ''}
          />
          {isSynced && (
            <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              This field is synced from Strava and cannot be edited
            </p>
          )}

          <FormTextarea
            register={register}
            name="description"
            label={tClub('description')}
            error={errors.description}
            rows={4}
            placeholder="Brief description of the club..."
            readOnly={isSynced}
            className={isSynced ? 'bg-gray-50 cursor-not-allowed' : ''}
          />
          {isSynced && (
            <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              This field is synced from Strava and cannot be edited
            </p>
          )}

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

      {/* Unlink Confirmation Dialog */}
      {showUnlinkDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-2">Unlink from Strava?</h3>
            <p className="text-sm text-gray-600 mb-4">
              This will disconnect the club from Strava and allow you to
              manually edit the name and description. You can re-sync at any
              time.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowUnlinkDialog(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleUnlink}
              >
                Unlink
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
