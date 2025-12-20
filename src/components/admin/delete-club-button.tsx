'use client'

import { useState, useEffect, useRef } from 'react'
import { Trash2 } from 'lucide-react'
import { useDeleteClub } from '@/lib/hooks/use-clubs'
import { useRouter } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { ConfirmDeleteDialog } from './confirm-delete-dialog'

export type DeleteClubButtonProps = {
  clubId: string
  clubName: string
}

export const DeleteClubButton = ({
  clubId,
  clubName,
}: DeleteClubButtonProps) => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const deleteClub = useDeleteClub()
  const router = useRouter()
  const isMounted = useRef(true)

  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])
  const t = useTranslations('forms.actions')

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteClub.mutateAsync(clubId)
      setDialogOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Failed to delete club:', error)
      alert('Failed to delete club. Please try again.')
    } finally {
      if (isMounted.current) {
        setIsDeleting(false)
      }
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={() => setDialogOpen(true)}
        aria-label={`Delete ${clubName}`}
      >
        {t('deleteClub')}
        <Trash2 className="w-4 h-4 ml-1" />
      </Button>

      <ConfirmDeleteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        entityType="Club"
        entityName={clubName}
        onConfirm={handleDelete}
        loading={isDeleting}
      />
    </>
  )
}
