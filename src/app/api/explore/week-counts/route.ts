import { withPublic } from '@/lib/api-middleware'
import { publicCacheHeaders } from '@/lib/public-cache'
import { z } from 'zod'
import { getWeekEventCounts } from '@/lib/services/events'

export const GET = withPublic(z.object({}))(async () => {
  let counts: Awaited<ReturnType<typeof getWeekEventCounts>> = []
  try {
    counts = await getWeekEventCounts()
  } catch (error) {
    console.error('Explore week counts unavailable:', error)
  }
  return Response.json(counts, { headers: publicCacheHeaders() })
})
