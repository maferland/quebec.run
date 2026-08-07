import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from './route'
import { getEventById } from '@/lib/services/events'

vi.mock('@/lib/services/events', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/services/events')>()),
  getEventById: vi.fn(),
}))

const club = {
  id: 'club-1',
  name: 'Club des Coureurs',
  slug: 'club-des-coureurs',
  type: 'ROAD',
  vibe: 'SOCIAL',
  beginnerFriendly: true,
  paceMin: '5:00',
  paceMax: '6:00',
  description: 'A friendly running club.',
}

function request(id: string) {
  return new Request(`http://localhost/api/explore/runs/${id}`)
}

function context(id: string) {
  return { params: Promise.resolve({ id }) }
}

describe('GET /api/explore/runs/[id]', () => {
  beforeEach(() => {
    vi.mocked(getEventById).mockReset()
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  it('returns the recurring arm for a virtual occurrence', async () => {
    vi.mocked(getEventById).mockResolvedValue({
      id: 'club-des-coureurs-mardi--2026-08-04',
      recurringSlug: 'mardi',
      title: 'Mardi Run',
      description: null,
      date: new Date('2026-08-04T22:00:00.000Z'),
      time: '18:00',
      address: '123 Rue Principale',
      latitude: 46.8,
      longitude: -71.2,
      distance: '5',
      pace: null,
      pacePolicy: 'SHARED',
      status: 'SCHEDULED',
      club,
      // fields present on the virtual event shape but not part of the response
      clubId: club.id,
      organizationId: null,
      recurringEventId: 'recurring-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      geocodedAt: null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    const response = await GET(request('id'), context('id'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.kind).toBe('recurring')
    expect(data.recurringSlug).toBe('mardi')
    expect(data.status).toBe('SCHEDULED')
    expect(data.club).toEqual(club)
  })

  it('returns the one-off arm for a stored event', async () => {
    vi.mocked(getEventById).mockResolvedValue({
      id: 'event-1',
      title: 'One-off Trail Run',
      description: null,
      date: new Date('2026-08-04T22:00:00.000Z'),
      time: '09:00',
      address: '456 Chemin de la Montagne',
      latitude: 46.9,
      longitude: -71.3,
      distance: null,
      pace: '6:00',
      pacePolicy: 'OPEN_PACE',
      status: 'CANCELLED',
      club,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    const response = await GET(request('event-1'), context('event-1'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.kind).toBe('one-off')
    expect(data.recurringSlug).toBeUndefined()
    expect(data.status).toBe('CANCELLED')
  })

  it('accepts every club type and vibe Prisma can store', async () => {
    vi.mocked(getEventById).mockResolvedValue({
      id: 'event-1',
      title: 'Track Night',
      description: null,
      date: new Date('2026-08-04T22:00:00.000Z'),
      time: '19:00',
      address: null,
      latitude: null,
      longitude: null,
      distance: null,
      pace: null,
      pacePolicy: null,
      status: 'SCHEDULED',
      club: { ...club, type: 'MIXED', vibe: 'COMPETITIVE' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    const response = await GET(request('event-1'), context('event-1'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.club.type).toBe('MIXED')
    expect(data.club.vibe).toBe('COMPETITIVE')
  })

  it('accepts a date already serialized to a string by the public cache', async () => {
    vi.mocked(getEventById).mockResolvedValue({
      id: 'event-1',
      title: 'Cached Event',
      description: null,
      // unstable_cache hands back JSON, so a cache hit yields an ISO string.
      date: '2026-08-04T22:00:00.000Z',
      time: '09:00',
      address: null,
      latitude: null,
      longitude: null,
      distance: null,
      pace: null,
      pacePolicy: null,
      status: 'SCHEDULED',
      club,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    const response = await GET(request('event-1'), context('event-1'))
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.date).toBe('2026-08-04T22:00:00.000Z')
  })

  it('returns 404 when the event is not found', async () => {
    vi.mocked(getEventById).mockResolvedValue(null)

    const response = await GET(request('missing'), context('missing'))
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Not found')
  })

  it('returns 404 when the event has no club', async () => {
    vi.mocked(getEventById).mockResolvedValue({
      id: 'event-1',
      title: 'Clubless Event',
      description: null,
      date: new Date('2026-08-04T22:00:00.000Z'),
      time: '09:00',
      address: null,
      latitude: null,
      longitude: null,
      distance: null,
      pace: null,
      pacePolicy: null,
      status: 'SCHEDULED',
      club: null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    const response = await GET(request('event-1'), context('event-1'))
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Not found')
  })

  it('returns 500 for a malformed payload that fails the response schema', async () => {
    vi.mocked(getEventById).mockResolvedValue({
      id: 'event-1',
      title: 'Broken Event',
      description: null,
      date: new Date('2026-08-04T22:00:00.000Z'),
      time: '09:00',
      address: null,
      latitude: null,
      longitude: null,
      distance: null,
      pace: null,
      pacePolicy: null,
      // Invalid: status is not one of the enum values the schema allows.
      status: 'BOGUS',
      club,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    const response = await GET(request('event-1'), context('event-1'))
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Invalid run detail response')
  })
})
