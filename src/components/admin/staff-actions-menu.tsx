'use client'

import { MoreVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

type StaffActionsMenuProps = {
  user: {
    id: string
    name: string | null
    email: string
    isStaff: boolean
  }
  currentUserId: string
  onToggleStaff: (userId: string, makeStaff: boolean) => void
}

export function StaffActionsMenu({
  user,
  currentUserId,
  onToggleStaff,
}: StaffActionsMenuProps) {
  const isCurrentUser = user.id === currentUserId

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Staff actions">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {user.isStaff ? (
          <DropdownMenuItem
            disabled={isCurrentUser}
            className="text-error"
            onClick={() => onToggleStaff(user.id, false)}
          >
            Remove Staff
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => onToggleStaff(user.id, true)}>
            Make Staff
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
