import { withPublic } from '@/lib/api-middleware'
import { z } from 'zod'
import { getClubDetailBySlug } from '@/lib/services/clubs'

const schema = z.object({ slug: z.string().min(1) })

export const GET = withPublic(schema)(async (data) => {
  const club = await getClubDetailBySlug(data.slug)
  if (!club) return Response.json({ error: 'Not found' }, { status: 404 })
  return Response.json(club)
})
