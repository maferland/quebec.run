import { withAuth, withPublic } from '@/lib/api-middleware'
import { clubDeleteSchema, clubIdSchema, clubUpdateSchema } from '@/lib/schemas'
import { deleteClub, getClubById, updateClubById } from '@/lib/services/clubs'

export const GET = withPublic(clubIdSchema)(async (data) => {
  const club = await getClubById({ data })
  return Response.json(club)
})

export const PUT = withAuth(clubUpdateSchema)(async ({ user, data }) => {
  const club = await updateClubById({ user, data })
  return Response.json(club)
})

export const DELETE = withAuth(clubDeleteSchema)(async ({ user, data }) => {
  await deleteClub({ user, data })
  return Response.json({ success: true })
})
