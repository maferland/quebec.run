'use client'

import { Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToggleUserAdmin } from '@/lib/hooks/use-users'

interface ToggleAdminButtonProps {
  userId: string
  userName: string
  isAdmin: boolean
  isCurrentUser: boolean
}

export function ToggleAdminButton({
  userId,
  userName,
  isAdmin,
  isCurrentUser,
}: ToggleAdminButtonProps) {
  const toggleAdmin = useToggleUserAdmin()

  const handleToggle = async () => {
    const message = isAdmin
      ? `Revoke admin access from ${userName}?`
      : `Grant admin access to ${userName}?`

    if (!confirm(message)) {
      return
    }

    try {
      await toggleAdmin.mutateAsync({
        id: userId,
        isAdmin: !isAdmin,
      })
    } catch {
      alert('Failed to update admin status. Please try again.')
    }
  }

  return (
    <Button
      variant={isAdmin ? 'outline-primary' : 'outline'}
      size="sm"
      onClick={handleToggle}
      disabled={isCurrentUser || toggleAdmin.isPending}
      aria-label={
        isAdmin ? `Revoke admin from ${userName}` : `Grant admin to ${userName}`
      }
    >
      <Shield
        className={`w-4 h-4 ${isAdmin ? 'text-primary' : 'text-text-secondary'}`}
      />
    </Button>
  )
}
