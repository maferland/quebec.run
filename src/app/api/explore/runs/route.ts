import { withPublic } from '@/lib/api-middleware'
import { exploreDaySchema } from '@/lib/schemas'
import { getEventsForDay } from '@/lib/services/events'

export const GET = withPublic(exploreDaySchema)(async (data) => {
  const runs = await getEventsForDay(data.day)
  return Response.json(runs)
})
