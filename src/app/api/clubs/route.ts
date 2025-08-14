import { NextRequest } from 'next/server'
import { getAllClubs, createClub } from '@/lib/services/clubs'
import { getQueryParams, withErrorHandler } from '@/lib/route-helpers'

export const GET = withErrorHandler(async (request: NextRequest) => {
  const queryData = getQueryParams(request)
  const clubs = await getAllClubs(queryData)
  return Response.json(clubs)
})

export const POST = withErrorHandler(async (request: NextRequest) => {
  const body = await request.json()
  const club = await createClub(body)
  return Response.json(club, { status: 201 })
})