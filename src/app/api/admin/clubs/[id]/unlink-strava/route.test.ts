// src/app/api/admin/clubs/[id]/unlink-strava/route.test.ts
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { cleanDatabase } from '@/lib/test-seed'

vi.mock('next-auth')

describe('POST /api/admin/clubs/[id]/unlink-strava', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await cleanDatabase()
  })

  test('returns 401 when not admin', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: '1', email: 'user@test.com', isAdmin: false },
      expires: '2025-01-01',
    })

    const request = new Request('http://localhost', { method: 'POST' })
    const response = await POST(request, { params: { id: 'club1' } })

    expect(response.status).toBe(401)
  })

  test('unlinks club and deletes events', async () => {
    const user = await prisma.user.create({
      data: { email: 'admin@test.com', isAdmin: true },
    })

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: user.id, email: user.email, isAdmin: true },
      expires: '2025-01-01',
    })

    const club = await prisma.club.create({
      data: {
        name: 'Test Club',
        slug: 'test-club',
        stravaSlug: 'test-123',
        stravaClubId: '123',
        ownerId: user.id,
      },
    })

    // Create Strava events
    await prisma.event.createMany({
      data: [
        {
          clubId: club.id,
          stravaEventId: '1',
          title: 'Event 1',
          date: new Date(),
          time: '08:00',
        },
        {
          clubId: club.id,
          stravaEventId: '2',
          title: 'Event 2',
          date: new Date(),
          time: '09:00',
        },
      ],
    })

    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ deleteEvents: true }),
    })
    const response = await POST(request, { params: { id: club.id } })

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.eventsDeleted).toBe(2)

    // Verify club unlinked
    const updated = await prisma.club.findUnique({ where: { id: club.id } })
    expect(updated?.stravaSlug).toBeNull()
    expect(updated?.stravaClubId).toBeNull()
    expect(updated?.isManual).toBe(true)

    // Verify events deleted
    const events = await prisma.event.findMany({ where: { clubId: club.id } })
    expect(events).toHaveLength(0)
  })

  test('unlinks club and converts events to manual', async () => {
    const user = await prisma.user.create({
      data: { email: 'admin@test.com', isAdmin: true },
    })

    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: user.id, email: user.email, isAdmin: true },
      expires: '2025-01-01',
    })

    const club = await prisma.club.create({
      data: {
        name: 'Test Club',
        slug: 'test-club',
        stravaSlug: 'test-123',
        stravaClubId: '123',
        ownerId: user.id,
      },
    })

    await prisma.event.create({
      data: {
        clubId: club.id,
        stravaEventId: '1',
        title: 'Event 1',
        date: new Date(),
        time: '08:00',
      },
    })

    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ deleteEvents: false }),
    })
    const response = await POST(request, { params: { id: club.id } })

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.eventsDeleted).toBe(0)

    // Verify events converted to manual
    const events = await prisma.event.findMany({ where: { clubId: club.id } })
    expect(events).toHaveLength(1)
    expect(events[0].stravaEventId).toBeNull()
  })
})
