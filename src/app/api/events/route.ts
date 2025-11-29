import { NextRequest } from 'next/server'
import { getAllEvents } from '@/lib/services/events'
import { withAuth } from '@/lib/api-middleware'
import { eventCreateSchema } from '@/lib/schemas'
import { createEvent } from '@/lib/services/events'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const search = url.searchParams.get('search') || undefined
    const limitParam = url.searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : 6

    const events = await getAllEvents({ data: { search, limit } })

    return Response.json(events)
  } catch (error) {
    console.error('Failed to fetch events:', error)
    return Response.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}

export const POST = withAuth(eventCreateSchema)(async ({ user, data }) => {
  const event = await createEvent({ user, data })
  return Response.json(event, { status: 201 })
})
