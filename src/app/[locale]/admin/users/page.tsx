'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useAllUsers, useToggleUserStaff } from '@/lib/hooks/use-users'
import { StaffActionsMenu } from '@/components/admin/staff-actions-menu'
import { ConfirmStaffDialog } from '@/components/admin/confirm-staff-dialog'

type User = {
  id: string
  email: string
  name: string | null
  isStaff: boolean
  createdAt: Date
  _count: { clubs: number }
}

export default function AdminUsersPage() {
  const t = useTranslations('admin.users')
  const { data: session } = useSession()
  const { data: users, isLoading } = useAllUsers()
  const [dialogState, setDialogState] = useState<{
    open: boolean
    user: User | null
    action: 'promote' | 'demote'
  }>({
    open: false,
    user: null,
    action: 'promote',
  })

  const toggleStaff = useToggleUserStaff()

  const handleToggleClick = (userId: string, makeStaff: boolean) => {
    const user = users?.find((u: User) => u.id === userId)
    if (!user) return

    setDialogState({
      open: true,
      user,
      action: makeStaff ? 'promote' : 'demote',
    })
  }

  const handleConfirm = () => {
    if (!dialogState.user) return

    toggleStaff.mutate(
      {
        id: dialogState.user.id,
        isStaff: dialogState.action === 'promote',
      },
      {
        onSuccess: () => {
          setDialogState({ open: false, user: null, action: 'promote' })
        },
      }
    )
  }

  if (isLoading) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-primary">
            {t('title')}
          </h1>
          <p className="text-text-secondary mt-2">
            Manage user permissions and access
          </p>
        </div>
        <div className="bg-surface rounded-lg border border-border p-8 text-center">
          <p className="text-text-secondary">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-primary">
            {t('title')}
          </h1>
          <p className="text-text-secondary mt-2">
            Manage user permissions and access
          </p>
        </div>

        {/* Users Table */}
        {!users || users.length === 0 ? (
          <div className="bg-surface rounded-lg border border-border p-8 text-center">
            <p className="text-text-secondary">No users found</p>
          </div>
        ) : (
          <div className="bg-surface rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-variant border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Clubs Owned
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Admin Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((user: User) => (
                    <tr key={user.id} className="hover:bg-surface-variant">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-primary">
                            {user.name || 'Unknown'}
                          </div>
                          <div className="text-xs text-text-secondary">
                            {user.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent">
                          {user._count.clubs} clubs
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.isStaff ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-variant text-text-secondary">
                            User
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-text-secondary">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <StaffActionsMenu
                          user={user}
                          currentUserId={session?.user?.id ?? ''}
                          onToggleStaff={handleToggleClick}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {dialogState.user && (
        <ConfirmStaffDialog
          open={dialogState.open}
          onOpenChange={(open) =>
            !open &&
            setDialogState({ open: false, user: null, action: 'promote' })
          }
          user={dialogState.user}
          action={dialogState.action}
          onConfirm={handleConfirm}
          loading={toggleStaff.isPending}
        />
      )}
    </>
  )
}
