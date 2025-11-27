import { withAuth } from '@/lib/api-middleware'
import { deletionRequestSchema } from '@/lib/schemas'
import {
  createDeletionRequest,
  getPendingDeletionRequest,
} from '@/lib/services/legal'

export const POST = withAuth(deletionRequestSchema)(async ({ user, data }) => {
  const request = await createDeletionRequest({ user, data })

  return Response.json(
    {
      success: true,
      requestId: request.id,
      scheduledFor: request.scheduledFor.toISOString(),
    },
    { status: 201 }
  )
})

export const GET = withAuth(deletionRequestSchema)(async ({ user }) => {
  const request = await getPendingDeletionRequest({
    data: {},
    userId: user.id,
  })

  return Response.json({
    hasPendingRequest: !!request,
    request,
  })
})
