import { withAuth, withPublic } from '@/lib/api-middleware'
import { eventCreateSchema, eventsQuerySchema } from '@/lib/schemas'
import { createEvent, getAllEvents } from '@/lib/services/events'

export const GET = withPublic(eventsQuerySchema)(async (data) => {
  const events = await getAllEvents({ data })
  return Response.json(events)
})

export const POST = withAuth(eventCreateSchema)(async ({ user, data }) => {
  const event = await createEvent({ user, data })
  return Response.json(event, { status: 201 })
})
