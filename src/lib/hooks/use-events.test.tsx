import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@/lib/test-utils'
import { setupMSW } from '@/lib/test-msw-setup'
import { useUpcomingEvents } from './use-events'

// Setup MSW
setupMSW()

describe('useEvents hooks', () => {
  describe('useUpcomingEvents', () => {
    it('fetches upcoming events successfully', async () => {
      const { result } = renderHook(() => useUpcomingEvents(), {})

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toBeDefined()
      expect(Array.isArray(result.current.data)).toBe(true)
      expect(result.current.data!.length).toBeGreaterThan(0)
      expect(result.current.data![0]).toHaveProperty('id')
      expect(result.current.data![0]).toHaveProperty('title')
      expect(result.current.data![0]).toHaveProperty('club')
      expect(result.current.data![0].club).toHaveProperty('name')
    })

    it('handles query parameters', async () => {
      const { result } = renderHook(
        () => useUpcomingEvents({ limit: 5, offset: 0 }),
        {}
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toBeDefined()
      expect(Array.isArray(result.current.data)).toBe(true)
    })

    it('filters by clubId', async () => {
      const { result } = renderHook(
        () => useUpcomingEvents({ clubId: 'club-1' }),
        {}
      )

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
        http.get('/api/events', () => {
          return HttpResponse.json({ error: 'Server error' }, { status: 500 })
        })
      )

      const { result } = renderHook(() => useUpcomingEvents(), {})

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeDefined()
    })
  })
})
