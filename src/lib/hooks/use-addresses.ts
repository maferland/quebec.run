import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  AddressCreate,
  AddressUpdate,
  AddressesQuery,
} from '@/lib/schemas/addresses'

export type Address = {
  id: string
  label: string
  address: string
  latitude: number | null
  longitude: number | null
  clubId: string | null
  organizationId: string | null
  createdAt: Date
}

// API functions
async function fetchAddresses(query: AddressesQuery): Promise<Address[]> {
  const params = new URLSearchParams()
  if (query.clubId) params.set('clubId', query.clubId)
  if (query.organizationId) params.set('organizationId', query.organizationId)

  const url = `/api/addresses${params.toString() ? `?${params.toString()}` : ''}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Failed to fetch addresses')
  }

  return response.json()
}

async function createAddress(data: AddressCreate): Promise<Address> {
  const response = await fetch('/api/addresses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error('Failed to create address')
  }

  return response.json()
}

async function updateAddress({
  id,
  data,
}: {
  id: string
  data: AddressUpdate
}): Promise<Address> {
  const response = await fetch(`/api/addresses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error('Failed to update address')
  }

  return response.json()
}

async function deleteAddress(id: string): Promise<{ success: boolean }> {
  const response = await fetch(`/api/addresses/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error('Failed to delete address')
  }

  return { success: true }
}

// React Query hooks
export function useAddresses(query: AddressesQuery) {
  return useQuery({
    queryKey: ['addresses', query],
    queryFn: () => fetchAddresses(query),
    enabled: !!(query.clubId || query.organizationId),
  })
}

export function useCreateAddress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
    },
  })
}

export function useUpdateAddress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateAddress,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
      queryClient.invalidateQueries({ queryKey: ['address', variables.id] })
    },
  })
}

export function useDeleteAddress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteAddress,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
      queryClient.invalidateQueries({ queryKey: ['address', id] })
    },
  })
}
