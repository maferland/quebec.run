'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useDeleteClub } from '@/lib/hooks/use-clubs'
import { useRouter } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

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
  const t = useTranslations('forms.actions')

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
    <Button
      type="button"
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      disabled={isDeleting}
      aria-label={`Delete ${clubName}`}
    >
      {t('deleteClub')}
      <Trash2 className="w-4 h-4 ml-1" />
    </Button>
  )
}
