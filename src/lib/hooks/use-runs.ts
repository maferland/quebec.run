import { useQuery } from '@tanstack/react-query'
import type { RunsQuery, RunWithClub } from '@/lib/schemas'

// API functions
async function fetchUpcomingRuns(query: RunsQuery = {}): Promise<RunWithClub[]> {
  const params = new URLSearchParams()
  if (query.limit) params.set('limit', query.limit.toString())
  if (query.offset) params.set('offset', query.offset.toString())
  if (query.clubId) params.set('clubId', query.clubId)
  
  const url = `/api/runs${params.toString() ? `?${params.toString()}` : ''}`
  const response = await fetch(url)
  
  if (!response.ok) {
    throw new Error('Failed to fetch runs')
  }
  
  return response.json()
}

// React Query hooks
export function useUpcomingRuns(query: RunsQuery = {}) {
  return useQuery({
    queryKey: ['runs', 'upcoming', query],
    queryFn: () => fetchUpcomingRuns(query),
  })
}