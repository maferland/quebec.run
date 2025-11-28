'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useDeleteClub } from '@/lib/hooks/use-clubs'
import { useRouter } from '@/i18n/navigation'

export type DeleteClubButtonProps = {
  clubId: string
  clubName: string
}

export const DeleteClubButton = ({
  clubId,
  clubName,
}: DeleteClubButtonProps) => {
  const [isDeleting, setIsDeleting] = useState(false)
  const deleteClub = useDeleteClub()
  const router = useRouter()

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete "${clubName}"? This action cannot be undone.`
      )
    ) {
      return
    }

    setIsDeleting(true)
    try {
      await deleteClub.mutateAsync(clubId)
      router.refresh()
    } catch (error) {
      console.error('Failed to delete club:', error)
      alert('Failed to delete club. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="inline-flex items-center justify-center px-2 py-1 border border-border rounded-md text-xs font-medium text-red-600 bg-surface hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      aria-label={`Delete ${clubName}`}
    >
      <Trash2 className="w-3 h-3" />
    </button>
  )
}
