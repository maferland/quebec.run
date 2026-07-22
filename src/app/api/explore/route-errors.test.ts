import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET as getRuns } from './runs/route'
import { GET as getClubs } from './clubs/route'
import { GET as getWeekCounts } from './week-counts/route'
import { getEventsForDay, getWeekEventCounts } from '@/lib/services/events'
import { getClubsForExplore } from '@/lib/services/clubs'

vi.mock('@/lib/services/events', () => ({
  getEventsForDay: vi.fn(),
  getWeekEventCounts: vi.fn(),
}))

vi.mock('@/lib/services/clubs', () => ({
  getClubsForExplore: vi.fn(),
}))

const context = { params: Promise.resolve({}) }

describe('explore route database errors', () => {
  beforeEach(() => {
    vi.mocked(getEventsForDay).mockReset()
    vi.mocked(getWeekEventCounts).mockReset()
    vi.mocked(getClubsForExplore).mockReset()
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  it.each([
    {
      name: 'runs',
      request: new Request('http://localhost/api/explore/runs?day=0'),
      handler: getRuns,
      service: getEventsForDay,
    },
    {
      name: 'clubs',
      request: new Request('http://localhost/api/explore/clubs'),
      handler: getClubs,
      service: getClubsForExplore,
    },
    {
      name: 'week counts',
      request: new Request('http://localhost/api/explore/week-counts'),
      handler: getWeekCounts,
      service: getWeekEventCounts,
    },
  ])('returns an uncacheable 500 for $name failures', async (testCase) => {
    vi.mocked(testCase.service).mockRejectedValue(new Error('database down'))

    const response = await testCase.handler(testCase.request, context)

    expect(response.status).toBe(500)
    expect(response.headers.get('Cache-Control')).toBeNull()
    await expect(response.json()).resolves.toEqual({ error: 'database down' })
  })
})
