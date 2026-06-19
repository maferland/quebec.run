import { withPublic } from '@/lib/api-middleware'
import { z } from 'zod'
import { getClubsForExplore } from '@/lib/services/clubs'

export const GET = withPublic(z.object({}))(async () => {
  const clubs = await getClubsForExplore()
  return Response.json(clubs)
})
