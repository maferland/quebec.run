import { withAuth } from '@/lib/api-middleware'
import { deletionCancelSchema } from '@/lib/schemas'
import { cancelDeletionRequest } from '@/lib/services/legal'

export const DELETE = withAuth(deletionCancelSchema)(async ({ user, data }) => {
  await cancelDeletionRequest({ user, data })
  return Response.json({ success: true })
})
