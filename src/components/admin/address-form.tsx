'use client'

import { useFormWithSchema } from '@/lib/form/use-form-with-schema'
import { addressCreateSchema, type Address } from '@/lib/services/addresses'
import { useCreateAddress, useUpdateAddress } from '@/lib/hooks/use-addresses'
import { FormInput } from '@/components/ui/form-input'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { Save, X } from 'lucide-react'

interface AddressFormProps {
  clubId?: string
  organizationId?: string
  initialData?: Address
  onSuccess?: () => void
  onCancel: () => void
}

export function AddressForm({
  clubId,
  organizationId,
  initialData,
  onSuccess,
  onCancel,
}: AddressFormProps) {
  const t = useTranslations('admin.addresses')
  const tActions = useTranslations('forms.actions')
  const createMutation = useCreateAddress()
  const updateMutation = useUpdateAddress()

  const form = useFormWithSchema({
    schema: addressCreateSchema,
    defaultValues: {
      label: initialData?.label || '',
      address: initialData?.address || '',
      clubId,
      organizationId,
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form

  const isLoading =
    isSubmitting || createMutation.isPending || updateMutation.isPending

  const handleFormSubmit = handleSubmit(async (data) => {
    try {
      if (initialData) {
        await updateMutation.mutateAsync({
          id: initialData.id,
          data: { ...data, id: initialData.id },
        })
      } else {
        await createMutation.mutateAsync(data)
      }
      onSuccess?.()
    } catch (error) {
      console.error('Form submission error:', error)
    }
  })

  return (
    <form
      onSubmit={handleFormSubmit}
      noValidate
      className="bg-surface rounded-lg border border-border p-6"
    >
      <div className="space-y-4">
        <FormInput
          register={register}
          name="label"
          label={t('label')}
          error={errors.label}
          required
          placeholder="e.g. Main meeting spot"
        />

        <FormInput
          register={register}
          name="address"
          label={t('address')}
          error={errors.address}
          required
          placeholder="e.g. 123 Rue Saint-Jean, Quebec City, QC"
        />

        {!initialData && (
          <p className="text-sm text-text-secondary">{t('geocodingNote')}</p>
        )}
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          <X className="w-4 h-4 mr-2" />
          {tActions('cancel')}
        </Button>
        <Button type="submit" disabled={isLoading}>
          <Save className="w-4 h-4 mr-2" />
          {isLoading
            ? initialData
              ? tActions('updating')
              : tActions('creating')
            : initialData
              ? tActions('update')
              : tActions('create')}
        </Button>
      </div>
    </form>
  )
}
