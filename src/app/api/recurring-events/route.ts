import { withAuth, withPublic } from '@/lib/api-middleware'
import {
  createRecurringEvent,
  getRecurringEventsByClub,
} from '@/lib/services/recurring-events'
import { assertClubOwnership } from '@/lib/services/clubs'
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
 * Create recurring event (requires auth + club ownership)
 */
export const POST = withAuth(recurringEventCreateSchema)(async ({
  user,
  data,
}) => {
  await assertClubOwnership(data.clubId, user)
  const event = await createRecurringEvent(data)
  return Response.json(event, { status: 201 })
})
