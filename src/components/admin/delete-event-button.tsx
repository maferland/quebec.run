'use client'

import { useDeleteEvent } from '@/lib/hooks/use-events'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

export type DeleteEventButtonProps = {
  eventId: string
}

export function DeleteEventButton({ eventId }: DeleteEventButtonProps) {
  const t = useTranslations('admin.events')
  const router = useRouter()
  const deleteMutation = useDeleteEvent()

  const handleDelete = async () => {
    const confirmed = confirm(t('confirmDelete'))
    if (!confirmed) return

    try {
      await deleteMutation.mutateAsync(eventId)
      router.refresh()
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      disabled={deleteMutation.isPending}
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  )
}
