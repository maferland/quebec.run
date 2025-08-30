'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { useClub } from '@/lib/hooks/use-clubs'
import { ClubForm } from '@/components/admin/club-form'


export default function AdminEditClubPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const router = useRouter()
  const [slug, setSlug] = useState<string | null>(null)
  
  useEffect(() => {
    params.then(resolved => setSlug(resolved.slug))
  }, [params])

  const { data: club, isLoading, error } = useClub(slug || '')

  const handleSuccess = () => {
    router.push('/admin/clubs')
    router.refresh()
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
        <p className="text-text-secondary mt-1">
          Modify club information
        </p>
      </div>

      {/* Form */}
      <ClubForm mode="edit" initialData={club} onSuccess={handleSuccess} />
    </div>
  )
}