import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  EventsQuery,
  EventWithClub,
  EventCreate,
  EventUpdate,
} from '@/lib/schemas'

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

export function useCreateEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: EventCreate) => {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to create event')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })
}

export function useUpdateEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EventUpdate }) => {
      const res = await fetch(`/api/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to update event')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })
}

export function useDeleteEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete event')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })
}
