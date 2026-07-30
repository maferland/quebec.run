import { withPublic } from '@/lib/api-middleware'
import { publicCacheHeaders } from '@/lib/public-cache'
import { eventIdSchema, runDetailResponseSchema } from '@/lib/schemas'
import { getEventById } from '@/lib/services/events'

type EventForDetail = Awaited<ReturnType<typeof getEventById>>

// Shapes the service result into the response union. Occurrences synthesized
// from a recurring pattern carry `recurringSlug`; stored events don't.
// A clubless event has nothing for the detail panel to render, so it reads as
// missing here — same call the /run/[id] page makes.
function toRunDetailResponse(event: EventForDetail) {
  if (!event?.club) return null

  const shared = {
    id: event.id,
    title: event.title,
    description: event.description,
    date: event.date.toISOString(),
    time: event.time,
    address: event.address,
    latitude: event.latitude,
    longitude: event.longitude,
    distance: event.distance,
    pace: event.pace,
    pacePolicy: event.pacePolicy,
    club: event.club,
  }

  return 'recurringSlug' in event
    ? {
        ...shared,
        kind: 'recurring',
        status: event.status,
        recurringSlug: event.recurringSlug,
      }
    : { ...shared, kind: 'one-off', status: event.status }
}

export const GET = withPublic(eventIdSchema)(async (data) => {
  const payload = toRunDetailResponse(await getEventById({ data }))
  if (!payload) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  const parsed = runDetailResponseSchema.safeParse(payload)
  if (!parsed.success) {
    console.error('Invalid run detail response:', parsed.error)
    return Response.json(
      { error: 'Invalid run detail response' },
      { status: 500 }
    )
  }

  return Response.json(parsed.data, { headers: publicCacheHeaders() })
})
