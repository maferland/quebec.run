import { getTranslations } from 'next-intl/server'
import { prisma } from '@/lib/prisma'
import { ToggleAdminButton } from '@/components/admin/toggle-admin-button'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

async function getAllUsersForAdmin() {
  return await prisma.user.findMany({
    include: {
      _count: {
        select: { clubs: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export default async function AdminUsersPage() {
  const t = await getTranslations('admin.users')
  const session = await getServerSession(authOptions)
  const users = await getAllUsersForAdmin()

  return (
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
      {users.length === 0 ? (
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
                {users.map((user) => (
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
                      {user.isAdmin ? (
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
                      <ToggleAdminButton
                        userId={user.id}
                        userName={user.name || user.email}
                        isAdmin={user.isAdmin}
                        isCurrentUser={session?.user?.id === user.id}
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
  )
}
