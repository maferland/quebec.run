import { withPublic } from '@/lib/api-middleware'
import { eventIdSchema } from '@/lib/schemas'
import { getEventById } from '@/lib/services/events'

export const GET = withPublic(eventIdSchema)(async (data) => {
  const event = await getEventById({ data })
  return Response.json(event)
})
