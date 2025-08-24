import { withAuth, withPublic } from '@/lib/api-middleware'
import {
  clubDeleteSchema,
  clubSlugSchema,
  clubUpdateSchema,
} from '@/lib/schemas'
import { deleteClub, getClubBySlug, updateClubById } from '@/lib/services/clubs'

export const GET = withPublic(clubSlugSchema)(async (data) => {
  const club = await getClubBySlug(data)
  if (!club) {
    return Response.json({ error: 'Club not found' }, { status: 404 })
  }
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
