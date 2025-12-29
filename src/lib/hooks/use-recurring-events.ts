import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { RecurringEvent, Club } from '@client'
import type {
  RecurringEventCreateInput,
  RecurringEventUpdateInput,
} from '@/lib/schemas'

type RecurringEventWithClub = RecurringEvent & { club: Club }

// API functions
async function fetchRecurringEventsByClub(
  clubId: string
): Promise<RecurringEventWithClub[]> {
  const response = await fetch(`/api/recurring-events?clubId=${clubId}`)

  if (!response.ok) {
    throw new Error('Failed to fetch recurring events')
  }

  return response.json()
}

async function fetchRecurringEventById(
  id: string
): Promise<RecurringEventWithClub> {
  const response = await fetch(`/api/recurring-events/${id}`)

  if (!response.ok) {
    throw new Error('Failed to fetch recurring event')
  }

  return response.json()
}

async function createRecurringEvent(
  data: RecurringEventCreateInput
): Promise<RecurringEvent> {
  const response = await fetch('/api/recurring-events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error('Failed to create recurring event')
  }

  return response.json()
}

async function updateRecurringEvent(
  data: RecurringEventUpdateInput
): Promise<RecurringEvent> {
  const response = await fetch(`/api/recurring-events/${data.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error('Failed to update recurring event')
  }

  return response.json()
}

async function deleteRecurringEvent(id: string): Promise<{ success: boolean }> {
  const response = await fetch(`/api/recurring-events/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error('Failed to delete recurring event')
  }

  return response.json()
}

// React Query hooks

/**
 * Fetch recurring events for club
 */
export function useRecurringEvents(clubId: string) {
  return useQuery({
    queryKey: ['recurring-events', clubId],
    queryFn: () => fetchRecurringEventsByClub(clubId),
    enabled: !!clubId,
  })
}

/**
 * Fetch single recurring event by ID
 */
export function useRecurringEvent(id: string) {
  return useQuery({
    queryKey: ['recurring-event', id],
    queryFn: () => fetchRecurringEventById(id),
    enabled: !!id,
  })
}

/**
 * Create recurring event
 */
export function useCreateRecurringEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createRecurringEvent,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['recurring-events', data.clubId],
      })
    },
  })
}

/**
 * Update recurring event
 */
export function useUpdateRecurringEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateRecurringEvent,
    onSuccess: (returnedData, inputData) => {
      queryClient.invalidateQueries({
        queryKey: ['recurring-event', inputData.id],
      })
      queryClient.invalidateQueries({
        queryKey: ['recurring-events', returnedData.clubId],
      })
    },
  })
}

/**
 * Delete recurring event
 */
export function useDeleteRecurringEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteRecurringEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-events'] })
    },
  })
}
