import { withPublic } from '@/lib/api-middleware'
import { publicCacheHeaders } from '@/lib/public-cache'
import { eventIdSchema, runDetailResponseSchema } from '@/lib/schemas'
import { getEventById, toRunDetailResponse } from '@/lib/services/events'

export const GET = withPublic(eventIdSchema)(async (data) => {
  const payload = toRunDetailResponse(await getEventById({ data }))
  if (!payload) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  const parsed = runDetailResponseSchema.safeParse(payload)
  if (!parsed.success) {
    console.error(
      `Invalid run detail response for event ${data.id}:`,
      parsed.error
    )
    return Response.json(
      { error: 'Invalid run detail response' },
      { status: 500 }
    )
  }

  return Response.json(parsed.data, { headers: publicCacheHeaders() })
})
