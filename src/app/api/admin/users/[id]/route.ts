import { withAuth } from '@/lib/api-middleware'
import { toggleUserStaffSchema } from '@/lib/schemas'
import { toggleUserStaff } from '@/lib/services/users'

export const PATCH = withAuth(toggleUserStaffSchema)(async ({ user, data }) => {
  if (!user.isStaff) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const updatedUser = await toggleUserStaff({ user, data })
  return Response.json(updatedUser)
})
