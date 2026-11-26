import { afterEach, expect, it, vi } from 'vitest'
import { getClubsForExplore } from '@/lib/services/clubs'
import { GET } from './route'

vi.mock('@/lib/services/clubs', () => ({ getClubsForExplore: vi.fn() }))
afterEach(() => vi.restoreAllMocks())

it('returns the public collection without reading a request', async () => {
  vi.mocked(getClubsForExplore).mockResolvedValue([])
  const response = await GET()
  expect(response.status).toBe(200)
  expect(await response.json()).toEqual([])
})

it('propagates failures and recovers on the next read', async () => {
  const error = new Error('database down')
  vi.mocked(getClubsForExplore)
    .mockRejectedValueOnce(error)
    .mockResolvedValueOnce([])
  await expect(GET()).rejects.toBe(error)
  expect(await (await GET()).json()).toEqual([])
})
