import { beforeEach, expect, it, vi } from 'vitest'
import { getClubsForExplore } from '@/lib/services/clubs'
import { getExploreSnapshot } from '@/lib/services/events'
import { ExploreShell } from '@/components/explore/explore-shell'
import ExploreLayout from './layout'

vi.mock('@/lib/services/clubs', () => ({ getClubsForExplore: vi.fn() }))
vi.mock('@/lib/services/events', () => ({ getExploreSnapshot: vi.fn() }))
vi.mock('@/components/explore/explore-shell', () => ({
  ExploreShell: () => null,
}))
vi.mock('@/app/providers', () => ({ ExploreProviders: () => null }))

beforeEach(() => {
  vi.mocked(getClubsForExplore).mockReset().mockResolvedValue([])
  vi.mocked(getExploreSnapshot).mockReset().mockResolvedValue({
    anchor: '2026-11-26T05:00:00.000Z',
    weekCounts: [],
    runs: [],
  })
})

it('owns the shell in the shared layout and supplies the first-paint detail and catalogue', async () => {
  const detail = <p>Run detail</p>
  const result = await ExploreLayout({ children: null, detail })
  const shell = result.props.children.find(
    (child: React.ReactElement | null) => child?.type === ExploreShell
  )
  expect(shell.props.serverDetail).toBe(detail)
  expect(shell.props.initialData).toEqual({
    anchor: '2026-11-26T05:00:00.000Z',
    weekCounts: [],
    runs: [],
    clubs: [],
  })
})

it('propagates catalogue failures instead of caching a successful empty shell', async () => {
  const error = new Error('database down')
  vi.mocked(getClubsForExplore).mockRejectedValueOnce(error)
  await expect(ExploreLayout({ children: null, detail: null })).rejects.toBe(
    error
  )
  vi.mocked(getExploreSnapshot).mockRejectedValueOnce(error)
  await expect(ExploreLayout({ children: null, detail: null })).rejects.toBe(
    error
  )
})
