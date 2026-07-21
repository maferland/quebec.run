import { withPublic } from '@/lib/api-middleware'
import { publicCacheHeaders } from '@/lib/public-cache'
import { exploreDaySchema } from '@/lib/schemas'
import { getEventsForDay } from '@/lib/services/events'

export const GET = withPublic(exploreDaySchema)(async (data) => {
  let runs: Awaited<ReturnType<typeof getEventsForDay>> = []
  try {
    runs = await getEventsForDay(data.day)
  } catch (error) {
    console.error('Explore runs unavailable:', error)
  }
  return Response.json(runs, { headers: publicCacheHeaders() })
})
