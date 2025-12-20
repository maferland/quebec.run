'use client'

import { useState } from 'react'
import {
  useAddresses,
  useDeleteAddress,
  type Address,
} from '@/lib/hooks/use-addresses'
import { Button } from '@/components/ui/button'
import { AddressMapPreview } from '@/components/admin/address-map-preview'
import { Plus, Trash2, Edit2, MapPin, ChevronDown } from 'lucide-react'
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
  const [expandedId, setExpandedId] = useState<string | null>(null)

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
      {!addresses || addresses.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
          <Plus className="w-12 h-12 mx-auto text-text-secondary mb-4" />
          <p className="text-text-primary font-medium mb-2">{t('empty')}</p>
          <p className="text-sm text-text-secondary mb-6">{t('emptyHint')}</p>
          <Button onClick={onAddAddress}>
            <Plus className="w-4 h-4 mr-2" />
            {t('addNew')}
          </Button>
        </div>
      ) : (
        <>
          <div className="flex justify-end">
            <Button onClick={onAddAddress}>
              <Plus className="w-4 h-4 mr-2" />
              {t('addNew')}
            </Button>
          </div>
          <div className="space-y-3">
            {addresses.map((address) => (
              <div
                key={address.id}
                className="border border-border rounded-lg overflow-hidden"
              >
                <div className="p-4 flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium">{address.label}</h4>
                    <p className="text-sm text-text-secondary mt-1">
                      {address.address}
                    </p>
                    {address.latitude && address.longitude && (
                      <button
                        onClick={() =>
                          setExpandedId(
                            expandedId === address.id ? null : address.id
                          )
                        }
                        className="text-xs text-primary hover:underline mt-2 flex items-center gap-1"
                      >
                        <MapPin className="w-3 h-3" />
                        {expandedId === address.id ? 'Hide' : 'Show'} location
                        <ChevronDown
                          className={`w-3 h-3 transition-transform ${expandedId === address.id ? 'rotate-180' : ''}`}
                        />
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditAddress(address)}
                    >
                      Edit
                      <Edit2 className="w-4 h-4 ml-1" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(address.id, address.label)}
                      disabled={deleteMutation.isPending}
                    >
                      Delete
                      <Trash2 className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
                {expandedId === address.id &&
                  address.latitude &&
                  address.longitude && (
                    <div className="px-4 pb-4">
                      <AddressMapPreview
                        latitude={address.latitude}
                        longitude={address.longitude}
                        label={address.label}
                      />
                    </div>
                  )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
