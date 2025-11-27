import { withPublic, withAuth } from '@/lib/api-middleware'
import { eventIdSchema, eventUpdateSchema } from '@/lib/schemas'
import { getEventById, updateEvent, deleteEvent } from '@/lib/services/events'

export const GET = withPublic(eventIdSchema)(async (data) => {
  const event = await getEventById({ data })
  return Response.json(event)
})

export const PUT = withAuth(eventUpdateSchema)(async ({ user, data }) => {
  const event = await updateEvent({ user, data })
  return Response.json(event)
})

export const DELETE = withAuth(eventIdSchema)(async ({ user, data }) => {
  await deleteEvent({ user, data })
  return Response.json({ success: true })
})
