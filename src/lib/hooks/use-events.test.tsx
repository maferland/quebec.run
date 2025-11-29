import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi } from 'vitest'
import { useEvents } from './use-events'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  Wrapper.displayName = 'QueryClientWrapper'
  return Wrapper
}

describe('useEvents', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('fetches events without search param', async () => {
    const mockEvents = [{ id: '1', title: 'Test Event' }]
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEvents,
    } as Response)

    const { result } = renderHook(() => useEvents({}), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(global.fetch).toHaveBeenCalledWith('/api/events?')
    expect(result.current.data).toEqual(mockEvents)
  })

  it('fetches events with search param', async () => {
    const mockEvents = [{ id: '1', title: 'Montreal Run' }]
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEvents,
    } as Response)

    const { result } = renderHook(() => useEvents({ search: 'montreal' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(global.fetch).toHaveBeenCalledWith('/api/events?search=montreal')
    expect(result.current.data).toEqual(mockEvents)
  })

  it('handles loading state', () => {
    vi.mocked(global.fetch).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    const { result } = renderHook(() => useEvents({}), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()
  })

  it('handles error state', async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('API Error'))

    const { result } = renderHook(() => useEvents({}), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeTruthy()
  })
})
