'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { useClub } from '@/lib/hooks/use-clubs'
import { ClubForm } from '@/components/admin/club-form'
import { AddressList } from '@/components/admin/address-list'
import { AddressForm } from '@/components/admin/address-form'
import type { Address } from '@/lib/hooks/use-addresses'

export default function AdminEditClubPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const router = useRouter()
  const [slug, setSlug] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'info' | 'addresses'>('info')
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)

  useEffect(() => {
    params.then((resolved) => setSlug(resolved.slug))
  }, [params])

  const { data: club, isLoading, error } = useClub(slug || '')

  const handleSuccess = () => {
    router.push('/admin/clubs')
    router.refresh()
  }

  const handleAddAddress = () => {
    setEditingAddress(null)
    setIsAddressFormOpen(true)
  }

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address)
    setIsAddressFormOpen(true)
  }

  const handleAddressFormSuccess = () => {
    setIsAddressFormOpen(false)
    setEditingAddress(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading club...</p>
        </div>
      </div>
    )
  }

  if (error || !club) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">Club not found</p>
      </div>
    )
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-4">
        <Link
          href="/admin/clubs"
          className="flex items-center text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Clubs
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-primary">
          Edit Club: {club.name}
        </h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-border mb-6">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('info')}
            className={`pb-4 border-b-2 transition-colors ${
              activeTab === 'info'
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            Club Information
          </button>
          <button
            onClick={() => setActiveTab('addresses')}
            className={`pb-4 border-b-2 transition-colors ${
              activeTab === 'addresses'
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            Saved Addresses
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <ClubForm mode="edit" initialData={club} onSuccess={handleSuccess} />
      )}

      {activeTab === 'addresses' && (
        <div>
          <p className="text-text-secondary mb-6">
            Manage frequently used addresses for events
          </p>
          {isAddressFormOpen ? (
            <AddressForm
              initialData={editingAddress || undefined}
              clubId={club.id}
              onSuccess={handleAddressFormSuccess}
              onCancel={() => setIsAddressFormOpen(false)}
            />
          ) : (
            <AddressList
              clubId={club.id}
              onAddAddress={handleAddAddress}
              onEditAddress={handleEditAddress}
            />
          )}
        </div>
      )}
    </div>
  )
}
