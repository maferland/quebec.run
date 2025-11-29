import { GET } from './route'
import { getAllEvents, type GetAllEventsReturn } from '@/lib/services/events'
import { NextRequest } from 'next/server'
import { vi } from 'vitest'

vi.mock('@/lib/services/events')

describe('/api/events', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns events without search param', async () => {
    const mockEvents: GetAllEventsReturn[] = [
      {
        id: '1',
        title: 'Test Event',
        date: new Date(),
        time: '10:00',
        address: 'Test Address',
        distance: null,
        pace: null,
        club: { name: 'Test Club' },
      },
    ]
    vi.mocked(getAllEvents).mockResolvedValue(mockEvents)

    const request = new Request('http://localhost:3000/api/events')
    const response = await GET(request as NextRequest)
    const data = await response.json()

    expect(getAllEvents).toHaveBeenCalledWith({ data: { limit: 6 } })
    expect(response.status).toBe(200)
    expect(data).toHaveLength(1)
    expect(data[0]).toMatchObject({
      id: '1',
      title: 'Test Event',
      club: { name: 'Test Club' },
    })
  })

  it('returns events with search param', async () => {
    const mockEvents: GetAllEventsReturn[] = [
      {
        id: '1',
        title: 'Montreal Run',
        date: new Date(),
        time: '10:00',
        address: 'Montreal',
        distance: null,
        pace: null,
        club: { name: 'Montreal Runners' },
      },
    ]
    vi.mocked(getAllEvents).mockResolvedValue(mockEvents)

    const request = new Request(
      'http://localhost:3000/api/events?search=montreal'
    )
    const response = await GET(request as NextRequest)
    const data = await response.json()

    expect(getAllEvents).toHaveBeenCalledWith({
      data: { search: 'montreal', limit: 6 },
    })
    expect(data).toHaveLength(1)
    expect(data[0]).toMatchObject({
      id: '1',
      title: 'Montreal Run',
      club: { name: 'Montreal Runners' },
    })
  })

  it('handles custom limit param', async () => {
    vi.mocked(getAllEvents).mockResolvedValue([])

    const request = new Request('http://localhost:3000/api/events?limit=10')
    await GET(request as NextRequest)

    expect(getAllEvents).toHaveBeenCalledWith({
      data: { limit: 10 },
    })
  })

  it('handles errors', async () => {
    vi.mocked(getAllEvents).mockRejectedValue(new Error('DB Error'))

    const request = new Request('http://localhost:3000/api/events')
    const response = await GET(request as NextRequest)

    expect(response.status).toBe(500)
  })
})
