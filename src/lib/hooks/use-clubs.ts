import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  ClubsQuery,
  ClubCreate,
  ClubUpdate,
  ClubWithEvents,
  StravaSyncResponse,
} from '@/lib/schemas'

// API functions
async function fetchClubs(query: ClubsQuery = {}): Promise<ClubWithEvents[]> {
  const params = new URLSearchParams()
  if (query.limit) params.set('limit', query.limit.toString())
  if (query.offset) params.set('offset', query.offset.toString())

  const url = `/api/clubs${params.toString() ? `?${params.toString()}` : ''}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Failed to fetch clubs')
  }

  return response.json()
}

async function fetchClubById(id: string): Promise<ClubWithEvents> {
  const response = await fetch(`/api/clubs/${id}`)

  if (!response.ok) {
    throw new Error('Failed to fetch club')
  }

  return response.json()
}

async function createClub(data: ClubCreate): Promise<ClubWithEvents> {
  const response = await fetch('/api/clubs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Failed to create club' }))
    throw new Error(error.error || 'Failed to create club')
  }

  return response.json()
}

async function updateClub({
  id,
  data,
}: {
  id: string
  data: ClubUpdate
}): Promise<ClubWithEvents> {
  const response = await fetch(`/api/clubs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Failed to update club' }))
    throw new Error(error.error || 'Failed to update club')
  }

  return response.json()
}

async function deleteClub(id: string): Promise<{ success: boolean }> {
  const response = await fetch(`/api/clubs/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error('Failed to delete club')
  }

  return response.json()
}

async function fetchStravaClub(clubId: string): Promise<StravaSyncResponse> {
  const response = await fetch(`/api/strava/clubs/${clubId}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch Strava club')
  }

  return response.json()
}

// React Query hooks
export function useClubs(query: ClubsQuery = {}) {
  return useQuery({
    queryKey: ['clubs', query],
    queryFn: () => fetchClubs(query),
  })
}

export function useClub(id: string) {
  return useQuery({
    queryKey: ['club', id],
    queryFn: () => fetchClubById(id),
    enabled: !!id,
  })
}

export function useCreateClub() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createClub,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubs'] })
    },
  })
}

export function useUpdateClub() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateClub,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clubs'] })
      queryClient.invalidateQueries({ queryKey: ['club', variables.id] })
    },
  })
}

export function useDeleteClub() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteClub,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubs'] })
    },
  })
}

export function useStravaSync() {
  return useMutation({
    mutationFn: fetchStravaClub,
    // No cache invalidation needed - this doesn't modify our DB
  })
}
