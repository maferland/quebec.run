'use client'

import {
  useAddresses,
  useDeleteAddress,
  type Address,
} from '@/lib/hooks/use-addresses'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface AddressListProps {
  clubId?: string
  organizationId?: string
  onAddAddress: () => void
  onEditAddress: (address: Address) => void
}

export function AddressList({
  clubId,
  organizationId,
  onAddAddress,
  onEditAddress,
}: AddressListProps) {
  const t = useTranslations('admin.addresses')
  const { data: addresses, isLoading } = useAddresses({
    clubId,
    organizationId,
  })
  const deleteMutation = useDeleteAddress()

  const handleDelete = async (id: string, label: string) => {
    const confirmed = confirm(t('confirmDelete', { label }))
    if (!confirmed) return

    try {
      await deleteMutation.mutateAsync(id)
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  if (isLoading) {
    return <div className="text-text-secondary">{t('loading')}</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{t('title')}</h3>
        <Button onClick={onAddAddress}>
          <Plus className="w-4 h-4 mr-2" />
          {t('addNew')}
        </Button>
      </div>

      {!addresses || addresses.length === 0 ? (
        <div className="text-center py-8 text-text-secondary">
          <p>{t('empty')}</p>
          <p className="text-sm mt-2">{t('emptyHint')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="border border-border rounded-lg p-4 flex justify-between items-start"
            >
              <div className="flex-1">
                <h4 className="font-medium">{address.label}</h4>
                <p className="text-sm text-text-secondary mt-1">
                  {address.address}
                </p>
                {address.latitude && address.longitude && (
                  <p className="text-xs text-text-secondary mt-1">
                    {t('geocoded')}: {address.latitude.toFixed(6)},{' '}
                    {address.longitude.toFixed(6)}
                  </p>
                )}
              </div>
              <div className="flex gap-2 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditAddress(address)}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(address.id, address.label)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
