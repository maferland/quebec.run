import { NextRequest } from 'next/server'
import { getClubByIdWithParams, updateClubWithParams, deleteClub } from '@/lib/services/clubs'
import { withErrorHandler } from '@/lib/route-helpers'

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const club = await getClubByIdWithParams(params.id)
  if (!club) {
    return Response.json({ error: 'Club not found' }, { status: 404 })
  }
  return Response.json(club)
})

export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const body = await request.json()
  const updateFn = updateClubWithParams(params.id)
  const club = await updateFn(body)
  
  if (!club) {
    return Response.json({ error: 'Club not found' }, { status: 404 })
  }
  return Response.json(club)
})

export const DELETE = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const deleteData = { id: params.id }
  const result = await deleteClub(deleteData)
  
  if (!result) {
    return Response.json({ error: 'Club not found' }, { status: 404 })
  }
  return Response.json({ success: true })
})