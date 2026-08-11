'use client'

import { useAddresses } from '@/lib/hooks/use-addresses'
import { FormSelect } from '@/components/ui/form-select'
import { useTranslations } from 'next-intl'
import type {
  UseFormRegister,
  FieldError,
  FieldValues,
  Path,
} from 'react-hook-form'

interface AddressPickerProps<
  T extends FieldValues & { savedAddress?: string } = FieldValues & {
    savedAddress?: string
  },
> {
  clubId: string
  onAddressSelect: (address: string, label: string) => void
  register: UseFormRegister<T>
  error?: FieldError
}

export function AddressPicker<
  T extends FieldValues & { savedAddress?: string } = FieldValues & {
    savedAddress?: string
  },
>({ clubId, onAddressSelect, register, error }: AddressPickerProps<T>) {
  const t = useTranslations('forms.event')
  const { data: addresses, isLoading } = useAddresses({ clubId })

  const options = [
    { value: '', label: t('newAddress') },
    ...(addresses?.map((addr) => ({
      value: addr.address,
      label: `${addr.label} (${addr.address})`,
    })) || []),
  ]

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedAddress = e.target.value
    if (selectedAddress) {
      const selectedLabel =
        addresses?.find((addr) => addr.address === selectedAddress)?.label ?? ''
      onAddressSelect(selectedAddress, selectedLabel)
    }
  }

  if (isLoading) {
    return null
  }

  // Don't show if there are no saved addresses
  if (!addresses || addresses.length === 0) {
    return null
  }

  return (
    <FormSelect
      register={register}
      name={'savedAddress' as Path<T>}
      label={t('useSavedAddress')}
      error={error}
      options={options}
      onChange={handleChange}
    />
  )
}
