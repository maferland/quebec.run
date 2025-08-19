import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@/lib/test-utils'
import { setupMSW } from '@/lib/test-msw-setup'
import { useClubs, useClub, useCreateClub, useUpdateClub, useDeleteClub } from './use-clubs'

// Setup MSW
setupMSW()


describe('useClubs hook', () => {

  describe('useClubs', () => {
    it('fetches clubs successfully', async () => {
      const { result } = renderHook(() => useClubs(), {
        })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toBeDefined()
      expect(Array.isArray(result.current.data)).toBe(true)
      expect(result.current.data!.length).toBeGreaterThan(0)
      expect(result.current.data![0]).toHaveProperty('id')
      expect(result.current.data![0]).toHaveProperty('name')
      expect(result.current.data![0]).toHaveProperty('upcomingRuns')
    })

    it('handles query parameters', async () => {
      const { result } = renderHook(() => useClubs({ limit: 5, offset: 0 }), {
        })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toBeDefined()
      expect(Array.isArray(result.current.data)).toBe(true)
    })

    it('handles fetch errors', async () => {
      // Override MSW to return an error
      const { server } = await import('@/lib/test-msw')
      const { http, HttpResponse } = await import('msw')

      server.use(
        http.get('/api/clubs', () => {
          return HttpResponse.json({ error: 'Server error' }, { status: 500 })
        })
      )

      const { result } = renderHook(() => useClubs(), {
        })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeDefined()
    })
  })

  describe('useClub', () => {
    it('fetches a specific club successfully', async () => {
      const { result } = renderHook(() => useClub('club-1'), {
        })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toBeDefined()
      expect(result.current.data!.id).toBe('club-1')
      expect(result.current.data!.name).toBe('Morning Runners')
      expect(result.current.data!).toHaveProperty('upcomingRuns')
    })

    it('does not fetch when id is empty', () => {
      const { result } = renderHook(() => useClub(''), {
        })

      expect(result.current.status).toBe('pending')
      expect(result.current.fetchStatus).toBe('idle')
    })

    it('handles 404 errors', async () => {
      const { result } = renderHook(() => useClub('non-existent'), {
        })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeDefined()
    })
  })

  describe('useCreateClub', () => {
    it('creates a club successfully', async () => {
      const { result } = renderHook(() => useCreateClub(), {
        })

      const clubData = {
        name: 'Test Club',
        description: 'A test club',
        address: '123 Test St',
        website: 'https://test.com',
      }

      result.current.mutate(clubData)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toBeDefined()
      expect(result.current.data!.name).toBe('Test Club')
    })

    it('handles creation errors', async () => {
      const { server } = await import('@/lib/test-msw')
      const { http, HttpResponse } = await import('msw')

      server.use(
        http.post('/api/clubs', () => {
          return HttpResponse.json({ error: 'Validation error' }, { status: 400 })
        })
      )

      const { result } = renderHook(() => useCreateClub(), {
        })

      const clubData = {
        name: 'Test Club',
        address: '123 Test St',
      }

      result.current.mutate(clubData)

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeDefined()
    })
  })

  describe('useUpdateClub', () => {
    it('updates a club successfully', async () => {
      const { result } = renderHook(() => useUpdateClub(), {
        })

      const updateData = {
        id: 'club-1',
        data: {
          id: 'club-1',
          name: 'Updated Club Name',
          description: 'Updated description',
        },
      }

      result.current.mutate(updateData)

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toBeDefined()
      expect(result.current.data!.name).toBe('Updated Club Name')
    })
  })

  describe('useDeleteClub', () => {
    it('deletes a club successfully', async () => {
      const { result } = renderHook(() => useDeleteClub(), {
        })

      result.current.mutate('club-1')

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toBeDefined()
      expect(result.current.data!.success).toBe(true)
    })
  })
})