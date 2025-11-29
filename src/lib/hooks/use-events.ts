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

async function createEvent(data: EventCreate): Promise<EventWithClub> {
  const response = await fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error('Failed to create event')
  }

  return response.json()
}

async function updateEvent({
  id,
  data,
}: {
  id: string
  data: EventUpdate
}): Promise<EventWithClub> {
  const response = await fetch(`/api/events/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error('Failed to update event')
  }

  return response.json()
}

async function deleteEvent(id: string): Promise<{ success: boolean }> {
  const response = await fetch(`/api/events/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error('Failed to delete event')
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
    mutationFn: createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })
}

export function useUpdateEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateEvent,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['event', variables.id] })
    },
  })
}

export function useDeleteEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteEvent,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['event', id] })
    },
  })
}

// useEvents hook for home page search
type UseEventsParams = {
  search?: string
  limit?: number
}

export function useEvents(params: UseEventsParams = {}) {
  const searchParams = new URLSearchParams()

  if (params.search) {
    searchParams.set('search', params.search)
  }

  if (params.limit) {
    searchParams.set('limit', params.limit.toString())
  }

  return useQuery({
    queryKey: ['events', params],
    queryFn: async () => {
      const response = await fetch(`/api/events?${searchParams.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch events')
      }
      return response.json()
    },
    enabled: true,
  })
}
