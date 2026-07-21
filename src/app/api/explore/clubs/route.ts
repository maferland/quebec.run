import { withPublic } from '@/lib/api-middleware'
import { publicCacheHeaders } from '@/lib/public-cache'
import { z } from 'zod'
import { getClubsForExplore } from '@/lib/services/clubs'

export const GET = withPublic(z.object({}))(async () => {
  let clubs: Awaited<ReturnType<typeof getClubsForExplore>> = []
  try {
    clubs = await getClubsForExplore()
  } catch (error) {
    console.error('Explore clubs unavailable:', error)
  }
  return Response.json(clubs, { headers: publicCacheHeaders() })
})
