import { expect, it, vi } from 'vitest'
import { getEventById } from '@/lib/services/events'
import RunDetailSlot from './page'

vi.mock('@/lib/services/events', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/services/events')>()),
  getEventById: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('notFound')
  }),
}))

it('renders the run panel with the resolved event', async () => {
  vi.mocked(getEventById).mockResolvedValue({
    id: 'club-slug-run-slug--2026-03-08',
    recurringSlug: 'run-slug',
    title: 'Sunday Run',
    description: null,
    date: new Date('2026-03-08T14:00:00.000Z'),
    time: '09:00',
    address: '1 Rue Test',
    latitude: 46.8,
    longitude: -71.2,
    distance: '5',
    pace: null,
    pacePolicy: 'SHARED',
    status: 'SCHEDULED',
    club: {
      id: 'club-1',
      slug: 'club-slug',
      name: 'Test Club',
      description: null,
      type: null,
      vibe: null,
      beginnerFriendly: false,
      paceMin: null,
      paceMax: null,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any)

  const element = await RunDetailSlot({
    params: Promise.resolve({
      locale: 'fr',
      id: 'club-slug-run-slug--2026-03-08',
    }),
  })

  expect(element.props.run.title).toBe('Sunday Run')
  expect(element.props.run.club.slug).toBe('club-slug')
  expect(element.props.locale).toBe('fr')
})

it('404s when the event cannot be resolved', async () => {
  vi.mocked(getEventById).mockResolvedValue(null)

  await expect(
    RunDetailSlot({ params: Promise.resolve({ locale: 'fr', id: 'missing' }) })
  ).rejects.toThrow('notFound')
})
