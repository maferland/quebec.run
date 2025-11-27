import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { UsersQuery, ToggleUserAdmin } from '@/lib/schemas'

async function fetchAllUsers(query: UsersQuery = {}) {
  const params = new URLSearchParams()
  if (query.limit) params.set('limit', query.limit.toString())
  if (query.offset) params.set('offset', query.offset.toString())
  if (query.isAdmin) params.set('isAdmin', query.isAdmin)

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

export function useToggleUserAdmin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ToggleUserAdmin) => {
      const res = await fetch(`/api/admin/users/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to toggle admin status')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}
