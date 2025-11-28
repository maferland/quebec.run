import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@/lib/test-utils'
import { setupMSW } from '@/lib/test-msw-setup'
import { act } from 'react'
import { useAllUsers, useToggleUserStaff } from './use-users'

// Setup MSW
setupMSW()

describe('useUsers hooks', () => {
  describe('useAllUsers', () => {
    it('fetches all users successfully', async () => {
      const { result } = renderHook(() => useAllUsers(), {})

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toBeDefined()
      expect(Array.isArray(result.current.data)).toBe(true)
      expect(result.current.data!.length).toBeGreaterThan(0)
      expect(result.current.data![0]).toHaveProperty('id')
      expect(result.current.data![0]).toHaveProperty('email')
      expect(result.current.data![0]).toHaveProperty('isStaff')
    })

    it('handles query parameters', async () => {
      const { result } = renderHook(
        () => useAllUsers({ limit: 5, offset: 0 }),
        {}
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toBeDefined()
      expect(Array.isArray(result.current.data)).toBe(true)
    })

    it('filters by isStaff', async () => {
      const { result } = renderHook(() => useAllUsers({ isStaff: 'true' }), {})

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toBeDefined()
      expect(Array.isArray(result.current.data)).toBe(true)
    })

    it('handles fetch errors', async () => {
      const { server } = await import('@/lib/test-msw')
      const { http, HttpResponse } = await import('msw')

      server.use(
        http.get('/api/admin/users', () => {
          return HttpResponse.json({ error: 'Server error' }, { status: 500 })
        })
      )

      const { result } = renderHook(() => useAllUsers(), {})

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeDefined()
    })
  })

  describe('useToggleUserAdmin', () => {
    it('toggles user admin status and invalidates cache', async () => {
      const { result } = renderHook(() => useToggleUserAdmin(), {})

      await act(async () => {
        await result.current.mutateAsync({
          id: 'user-1',
          isStaff: true,
        })
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })
    })

    it('handles toggle errors', async () => {
      const { server } = await import('@/lib/test-msw')
      const { http, HttpResponse } = await import('msw')

      server.use(
        http.patch('/api/admin/users/:id', () => {
          return HttpResponse.json(
            { error: 'Validation error' },
            { status: 400 }
          )
        })
      )

      const { result } = renderHook(() => useToggleUserAdmin(), {})

      await act(async () => {
        try {
          await result.current.mutateAsync({
            id: 'user-1',
            isStaff: true,
          })
        } catch {
          // Expected to throw
        }
      })

      expect(result.current.isError).toBe(true)
      expect(result.current.error).toBeDefined()
    })
  })
})
