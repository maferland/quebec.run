'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { ClubForm } from '@/components/admin/club-form'

export default function AdminCreateClubPage() {
  const router = useRouter()

  const handleSuccess = () => {
    router.push('/admin/clubs')
    router.refresh()
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
          Create New Club
        </h1>
        <p className="text-text-secondary mt-1">
          Add a new running club to the platform
        </p>
      </div>

      {/* Form */}
      <ClubForm mode="create" onSuccess={handleSuccess} />
    </div>
  )
}