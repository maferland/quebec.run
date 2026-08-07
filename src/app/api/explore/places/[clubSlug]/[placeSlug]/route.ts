import { withPublic } from '@/lib/api-middleware'
import { publicCacheHeaders } from '@/lib/public-cache'
import { z } from 'zod'
import { getPlacePage } from '@/lib/services/recurring-events'
import { toPlaceDetail } from '@/lib/hooks/use-explore'

const schema = z.object({
  clubSlug: z.string().min(1),
  placeSlug: z.string().min(1),
  locale: z.enum(['fr', 'en']).default('fr'),
})

export const GET = withPublic(schema)(async (data) => {
  const place = await getPlacePage({
    clubSlug: data.clubSlug,
    placeSlug: data.placeSlug,
  })
  if (!place) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(toPlaceDetail(place, data.locale), {
    headers: publicCacheHeaders(),
  })
})
