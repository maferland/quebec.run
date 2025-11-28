import { withAuth } from '@/lib/api-middleware'
import { deletionRequestSchema } from '@/lib/schemas'
import { deleteUserAccount } from '@/lib/services/legal'

export const POST = withAuth(deletionRequestSchema)(async ({ user, data }) => {
  await deleteUserAccount({ user, data })

  return Response.json(
    {
      success: true,
    },
    { status: 200 }
  )
})
