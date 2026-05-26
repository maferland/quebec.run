import { withAuth, withPublic } from '@/lib/api-middleware'
import {
  getRecurringEventById,
  updateRecurringEvent,
  deleteRecurringEvent,
} from '@/lib/services/recurring-events'
import { assertClubOwnership } from '@/lib/services/clubs'
import { NotFoundError } from '@/lib/errors'
import {
  recurringEventIdSchema,
  recurringEventUpdateSchema,
  recurringEventDeleteSchema,
} from '@/lib/schemas'

/**
 * GET /api/recurring-events/[id]
 * Get recurring event by ID
 */
export const GET = withPublic(recurringEventIdSchema)(async (data) => {
  const event = await getRecurringEventById(data.id)

  if (!event) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  return Response.json(event)
})

/**
 * PUT /api/recurring-events/[id]
 * Update recurring event (requires auth + club ownership of the event's club)
 */
export const PUT = withAuth(recurringEventUpdateSchema)(async ({
  user,
  data,
}) => {
  const existing = await getRecurringEventById(data.id)
  if (!existing) throw new NotFoundError('Recurring event not found')
  await assertClubOwnership(existing.clubId, user)
  const event = await updateRecurringEvent(data.id, data)
  return Response.json(event)
})

/**
 * DELETE /api/recurring-events/[id]
 * Soft delete recurring event (requires auth + club ownership)
 */
export const DELETE = withAuth(recurringEventDeleteSchema)(async ({
  user,
  data,
}) => {
  const existing = await getRecurringEventById(data.id)
  if (!existing) throw new NotFoundError('Recurring event not found')
  await assertClubOwnership(existing.clubId, user)
  await deleteRecurringEvent(data.id)
  return Response.json({ success: true })
})
