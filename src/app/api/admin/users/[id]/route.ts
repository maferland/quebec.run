import { withAuth } from '@/lib/api-middleware'
import { toggleUserAdminSchema } from '@/lib/schemas'
import { toggleUserAdmin } from '@/lib/services/users'

export const PATCH = withAuth(toggleUserAdminSchema)(async ({ user, data }) => {
  if (!user.isAdmin) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const updatedUser = await toggleUserAdmin({ user, data })
  return Response.json(updatedUser)
})
