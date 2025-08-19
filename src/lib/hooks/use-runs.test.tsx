import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@/lib/test-utils'
import { setupMSW } from '@/lib/test-msw-setup'
import { useUpcomingRuns } from './use-runs'

// Setup MSW
setupMSW()


describe('useRuns hooks', () => {

  describe('useUpcomingRuns', () => {
    it('fetches upcoming runs successfully', async () => {
      const { result } = renderHook(() => useUpcomingRuns(), {
        })

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
      const { result } = renderHook(() => useUpcomingRuns({ limit: 5, offset: 0 }), {
        })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toBeDefined()
      expect(Array.isArray(result.current.data)).toBe(true)
    })

    it('filters by clubId', async () => {
      const { result } = renderHook(() => useUpcomingRuns({ clubId: 'club-1' }), {
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
        http.get('/api/runs', () => {
          return HttpResponse.json({ error: 'Server error' }, { status: 500 })
        })
      )

      const { result } = renderHook(() => useUpcomingRuns(), {
        })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeDefined()
    })
  })
})