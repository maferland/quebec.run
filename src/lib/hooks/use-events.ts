import { useQuery } from '@tanstack/react-query'
import type { EventsQuery, EventWithClub } from '@/lib/schemas'

// API functions
async function fetchUpcomingEvents(
  query: EventsQuery = {}
): Promise<EventWithClub[]> {
  const params = new URLSearchParams()
  if (query.limit) params.set('limit', query.limit.toString())
  if (query.offset) params.set('offset', query.offset.toString())
  if (query.clubId) params.set('clubId', query.clubId)

  const url = `/api/events${params.toString() ? `?${params.toString()}` : ''}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Failed to fetch events')
  }

  return response.json()
}

// React Query hooks
export function useUpcomingEvents(query: EventsQuery = {}) {
  return useQuery({
    queryKey: ['events', 'upcoming', query],
    queryFn: () => fetchUpcomingEvents(query),
  })
}
