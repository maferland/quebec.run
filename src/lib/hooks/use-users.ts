import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { UsersQuery, ToggleUserStaff } from '@/lib/schemas'

async function fetchAllUsers(query: UsersQuery = {}) {
  const params = new URLSearchParams()
  if (query.limit) params.set('limit', query.limit.toString())
  if (query.offset) params.set('offset', query.offset.toString())
  if (query.isStaff) params.set('isStaff', query.isStaff)

  const url = `/api/admin/users${params.toString() ? `?${params.toString()}` : ''}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Failed to fetch users')
  }

  return response.json()
}

export function useAllUsers(query: UsersQuery = {}) {
  return useQuery({
    queryKey: ['admin', 'users', query],
    queryFn: () => fetchAllUsers(query),
  })
}

export function useToggleUserStaff() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ToggleUserStaff) => {
      const res = await fetch(`/api/admin/users/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to toggle staff status')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}
