import { beforeEach, expect, it, vi } from 'vitest'
import { getEventById } from '@/lib/services/events'
import { getClubImageName } from '@/lib/services/clubs'
import RunPage, { generateMetadata } from './run/[id]/page'
import RunSlot from './@detail/run/[id]/page'
import { GET as runImage } from './run/[id]/opengraph-image/route'
import { GET as clubImage } from './clubs/[slug]/opengraph-image/route'

vi.mock('@/lib/services/events', () => ({
  getEventById: vi.fn(),
  toRunDetailResponse: (value: unknown) => value,
  getExploreSnapshot: vi.fn(),
}))
vi.mock('@/lib/services/clubs', () => ({
  getClubImageName: vi.fn(),
  getClubsForExplore: vi.fn(),
}))
vi.mock('next-intl/server', () => ({
  getTranslations: async () => () => 'translation',
}))
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('notFound')
  },
}))
beforeEach(() => vi.clearAllMocks())
const params = () => Promise.resolve({ locale: 'en', id: 'existing-run' })
const request = new Request('http://localhost/preview')

it('propagates the same operational error through metadata, page, slot and previews', async () => {
  const error = new Error('temporary database failure')
  vi.mocked(getEventById).mockRejectedValue(error)
  vi.mocked(getClubImageName).mockRejectedValue(error)
  await expect(generateMetadata({ params: params() })).rejects.toBe(error)
  await expect(RunPage({ params: params() })).rejects.toBe(error)
  await expect(RunSlot({ params: params() })).rejects.toBe(error)
  await expect(runImage(request, { params: params() })).rejects.toBe(error)
  await expect(
    clubImage(request, {
      params: Promise.resolve({ locale: 'en', slug: 'existing-club' }),
    })
  ).rejects.toBe(error)
})

it('still emits genuine not-found results once the backend recovers', async () => {
  vi.mocked(getEventById).mockResolvedValue(null)
  vi.mocked(getClubImageName).mockResolvedValue(null)
  await expect(RunPage({ params: params() })).rejects.toThrow('notFound')
  await expect(RunSlot({ params: params() })).rejects.toThrow('notFound')
  expect((await runImage(request, { params: params() })).status).toBe(404)
  expect(
    (
      await clubImage(request, {
        params: Promise.resolve({ locale: 'en', slug: 'missing' }),
      })
    ).status
  ).toBe(404)
})
