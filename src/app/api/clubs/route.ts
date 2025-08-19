import { withAuth, withPublic } from '@/lib/api-middleware'
import { clubCreateSchema, clubsQuerySchema } from '@/lib/schemas'
import { createClub, getAllClubs } from '@/lib/services/clubs'

export const GET = withPublic(clubsQuerySchema)(async (data) => {
  const clubs = await getAllClubs({ data })
  return Response.json(clubs)
})

export const POST = withAuth(clubCreateSchema)(async ({ user, data }) => {
  const club = await createClub({ user, data })
  return Response.json(club, { status: 201 })
})
