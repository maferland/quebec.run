import { withAuth, withPublic } from '@/lib/api-middleware'
import {
  getRecurringEventById,
  updateRecurringEvent,
  deleteRecurringEvent,
} from '@/lib/services/recurring-events'
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
 * Update recurring event (requires auth)
 */
export const PUT = withAuth(recurringEventUpdateSchema)(async ({ data }) => {
  // TODO: Check user owns club
  const event = await updateRecurringEvent(data.id, data)
  return Response.json(event)
})

/**
 * DELETE /api/recurring-events/[id]
 * Soft delete recurring event (requires auth)
 */
export const DELETE = withAuth(recurringEventDeleteSchema)(async ({ data }) => {
  // TODO: Check user owns club
  await deleteRecurringEvent(data.id)
  return Response.json({ success: true })
})
