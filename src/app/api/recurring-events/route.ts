import { withAuth, withPublic } from '@/lib/api-middleware'
import {
  createRecurringEvent,
  getRecurringEventsByClub,
} from '@/lib/services/recurring-events'
import {
  recurringEventCreateSchema,
  recurringEventQuerySchema,
} from '@/lib/schemas'

/**
 * GET /api/recurring-events?clubId=xxx
 * List recurring events for club
 */
export const GET = withPublic(recurringEventQuerySchema)(async (data) => {
  const events = await getRecurringEventsByClub(data.clubId)
  return Response.json(events)
})

/**
 * POST /api/recurring-events
 * Create recurring event (requires auth)
 */
export const POST = withAuth(recurringEventCreateSchema)(async ({ data }) => {
  // TODO: Check user owns club
  const event = await createRecurringEvent(data)
  return Response.json(event, { status: 201 })
})
