'use client'

import { Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToggleUserAdmin } from '@/lib/hooks/use-users'

interface ToggleAdminButtonProps {
  userId: string
  userName: string
  isStaff: boolean
  isCurrentUser: boolean
}

export function ToggleAdminButton({
  userId,
  userName,
  isStaff,
  isCurrentUser,
}: ToggleAdminButtonProps) {
  const toggleAdmin = useToggleUserAdmin()

  const handleToggle = async () => {
    const message = isStaff
      ? `Revoke admin access from ${userName}?`
      : `Grant admin access to ${userName}?`

    if (!confirm(message)) {
      return
    }

    try {
      await toggleAdmin.mutateAsync({
        id: userId,
        isStaff: !isStaff,
      })
    } catch {
      alert('Failed to update admin status. Please try again.')
    }
  }

  return (
    <Button
      variant={isStaff ? 'outline-primary' : 'outline'}
      size="sm"
      onClick={handleToggle}
      disabled={isCurrentUser || toggleAdmin.isPending}
      aria-label={
        isStaff ? `Revoke admin from ${userName}` : `Grant admin to ${userName}`
      }
    >
      <Shield
        className={`w-4 h-4 ${isStaff ? 'text-primary' : 'text-text-secondary'}`}
      />
    </Button>
  )
}
