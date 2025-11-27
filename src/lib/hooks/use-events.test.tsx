import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@/lib/test-utils'
import { setupMSW } from '@/lib/test-msw-setup'
import { act } from 'react'
import {
  useUpcomingEvents,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
} from './use-events'

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

  describe('useCreateEvent', () => {
    it('creates event and invalidates cache', async () => {
      const { result } = renderHook(() => useCreateEvent(), {})

      await act(async () => {
        await result.current.mutateAsync({
          title: 'New Event',
          date: '2025-12-01',
          time: '10:00',
          address: '123 Main St',
          clubId: 'club-1',
        })
      })

      expect(result.current.isSuccess).toBe(true)
    })

    it('handles creation errors', async () => {
      const { server } = await import('@/lib/test-msw')
      const { http, HttpResponse } = await import('msw')

      server.use(
        http.post('/api/events', () => {
          return HttpResponse.json(
            { error: 'Validation error' },
            { status: 400 }
          )
        })
      )

      const { result } = renderHook(() => useCreateEvent(), {})

      await act(async () => {
        try {
          await result.current.mutateAsync({
            title: 'New Event',
            date: '2025-12-01',
            time: '10:00',
            address: '123 Main St',
            clubId: 'club-1',
          })
        } catch {
          // Expected to throw
        }
      })

      expect(result.current.isError).toBe(true)
      expect(result.current.error).toBeDefined()
    })
  })

  describe('useUpdateEvent', () => {
    it('updates event and invalidates cache', async () => {
      const { result } = renderHook(() => useUpdateEvent(), {})

      await act(async () => {
        await result.current.mutateAsync({
          id: 'event-1',
          data: {
            id: 'event-1',
            title: 'Updated',
            date: '2025-12-01',
            time: '11:00',
            address: 'Address',
            clubId: 'club-1',
          },
        })
      })

      expect(result.current.isSuccess).toBe(true)
    })

    it('handles update errors', async () => {
      const { server } = await import('@/lib/test-msw')
      const { http, HttpResponse } = await import('msw')

      server.use(
        http.put('/api/events/:id', () => {
          return HttpResponse.json(
            { error: 'Validation error' },
            { status: 400 }
          )
        })
      )

      const { result } = renderHook(() => useUpdateEvent(), {})

      await act(async () => {
        try {
          await result.current.mutateAsync({
            id: 'event-1',
            data: {
              id: 'event-1',
              title: 'Updated',
              date: '2025-12-01',
              time: '11:00',
              address: 'Address',
              clubId: 'club-1',
            },
          })
        } catch {
          // Expected to throw
        }
      })

      expect(result.current.isError).toBe(true)
      expect(result.current.error).toBeDefined()
    })
  })

  describe('useDeleteEvent', () => {
    it('deletes event and invalidates cache', async () => {
      const { result } = renderHook(() => useDeleteEvent(), {})

      await act(async () => {
        await result.current.mutateAsync('event-1')
      })

      expect(result.current.isSuccess).toBe(true)
    })

    it('handles deletion errors', async () => {
      const { server } = await import('@/lib/test-msw')
      const { http, HttpResponse } = await import('msw')

      server.use(
        http.delete('/api/events/:id', () => {
          return HttpResponse.json({ error: 'Not found' }, { status: 400 })
        })
      )

      const { result } = renderHook(() => useDeleteEvent(), {})

      await act(async () => {
        try {
          await result.current.mutateAsync('event-1')
        } catch {
          // Expected to throw
        }
      })

      expect(result.current.isError).toBe(true)
      expect(result.current.error).toBeDefined()
    })
  })
})
