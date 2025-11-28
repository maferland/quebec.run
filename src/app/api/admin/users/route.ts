import { withAuth } from '@/lib/api-middleware'
import { usersQuerySchema } from '@/lib/schemas'
import { getAllUsersForAdmin } from '@/lib/services/users'

export const GET = withAuth(usersQuerySchema)(async ({ user, data }) => {
  if (!user.isStaff) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const users = await getAllUsersForAdmin({ data })
  return Response.json(users)
})
