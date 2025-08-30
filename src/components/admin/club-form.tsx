'use client'

import { useFormWithSchema } from '@/lib/form/use-form-with-schema'
import { clubCreateSchema, type ClubWithEvents } from '@/lib/schemas'
import { useCreateClub, useUpdateClub, useDeleteClub } from '@/lib/hooks/use-clubs'
import { FormInput } from '@/components/ui/form-input'
import { FormTextarea } from '@/components/ui/form-textarea'
import { FormSelect } from '@/components/ui/form-select'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Save, Trash2 } from 'lucide-react'

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
    },
  })

  const { register, handleSubmit, formState: { errors, isSubmitting } } = form

  const handleFormSubmit = handleSubmit(async (data) => {
    try {
      if (mode === 'create') {
        const newClub = await createMutation.mutateAsync(data)
        onSuccess?.(newClub)
      } else if (mode === 'edit' && initialData) {
        const updatedClub = await updateMutation.mutateAsync({
          id: initialData.id,
          data,
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

  const isLoading = isSubmitting || createMutation.isPending || updateMutation.isPending
  const isDeleting = deleteMutation.isPending

  return (
    <div className="max-w-2xl">
      <form onSubmit={handleFormSubmit} className="bg-surface rounded-lg border border-border p-6">
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
        </div>

        {/* Actions */}
        <div className="flex justify-between mt-8 pt-6 border-t border-border">
          {mode === 'edit' && (
            <Button
              type="button"
              variant="outline"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
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
            <Button 
              type="submit" 
              disabled={isLoading}
            >
              <Save className="w-4 h-4 mr-2" />
              {isLoading 
                ? mode === 'create' ? tActions('creating') : tActions('updating')
                : mode === 'create' ? tActions('create') : tActions('save')
              }
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}