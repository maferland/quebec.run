'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type ConfirmStaffDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: { email: string; name: string | null }
  action: 'promote' | 'demote'
  onConfirm: () => void
  loading: boolean
}

export function ConfirmStaffDialog({
  open,
  onOpenChange,
  user,
  action,
  onConfirm,
  loading,
}: ConfirmStaffDialogProps) {
  const [typed, setTyped] = useState('')
  const confirmPhrase = user.email
  const isValid = typed === confirmPhrase

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {action === 'promote' ? 'Make' : 'Remove'} {user.name || user.email}{' '}
            {action === 'promote' ? 'platform staff' : 'from staff'}?
          </DialogTitle>
          <DialogDescription asChild>
            {action === 'promote' ? (
              <div>
                <p className="mb-2">Staff members can:</p>
                <ul className="list-disc list-inside space-y-1 mb-4">
                  <li>Manage all clubs and events</li>
                  <li>View and modify all user accounts</li>
                  <li>Grant or revoke staff access</li>
                </ul>
                <p className="font-medium mb-2">
                  Type &quot;{confirmPhrase}&quot; to confirm:
                </p>
              </div>
            ) : (
              <div>
                <p className="mb-4 text-error">
                  This user will lose all platform administrative privileges.
                </p>
                <p className="font-medium mb-2">
                  Type &quot;{confirmPhrase}&quot; to confirm:
                </p>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <Input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={confirmPhrase}
          autoComplete="off"
          disabled={loading}
        />

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant={action === 'demote' ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={!isValid || loading}
            className={action === 'demote' ? 'destructive' : ''}
          >
            {loading
              ? 'Processing...'
              : action === 'promote'
                ? 'Make Staff'
                : 'Remove Staff'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
