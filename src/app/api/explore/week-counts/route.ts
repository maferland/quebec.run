import { withPublic } from '@/lib/api-middleware'
import { z } from 'zod'
import { getWeekEventCounts } from '@/lib/services/events'

export const GET = withPublic(z.object({}))(async () => {
  const counts = await getWeekEventCounts()
  return Response.json(counts)
})
