import { expect, it, vi } from 'vitest'
import { getClubDetailBySlug } from '@/lib/services/clubs'
import ClubDetailSlot from './page'

vi.mock('@/lib/services/clubs', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/services/clubs')>()),
  getClubDetailBySlug: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('notFound')
  }),
}))

it('renders the club panel with the resolved club', async () => {
  vi.mocked(getClubDetailBySlug).mockResolvedValue({
    id: 'club-1',
    slug: 'club-slug',
    name: 'Test Club',
    type: null,
    vibe: null,
    beginnerFriendly: false,
    paceMin: null,
    paceMax: null,
    description: null,
    website: null,
    instagram: null,
    facebook: null,
    memberCount: 0,
    lat: null,
    lng: null,
    schedule: [],
    upcomingRuns: [],
  })

  const element = await ClubDetailSlot({
    params: Promise.resolve({ locale: 'fr', slug: 'club-slug' }),
  })

  expect(element.props.club.name).toBe('Test Club')
  expect(element.props.club.slug).toBe('club-slug')
})

it('404s when the club cannot be resolved', async () => {
  vi.mocked(getClubDetailBySlug).mockResolvedValue(null)

  await expect(
    ClubDetailSlot({
      params: Promise.resolve({ locale: 'fr', slug: 'missing' }),
    })
  ).rejects.toThrow('notFound')
})
