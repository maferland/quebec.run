import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { GET, PUT, DELETE } from './route'
import { prisma } from '@/lib/prisma'
import { cleanDatabase } from '@/lib/test-seed'

// Mock next-auth
vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}))

import { getServerSession } from 'next-auth'
const mockGetServerSession = getServerSession as ReturnType<typeof vi.fn>

describe('GET /api/recurring-events/[id]', () => {
  beforeEach(async () => {
    await cleanDatabase()
  })

  afterEach(() => {
    mockGetServerSession.mockReset()
  })

  it('returns recurring event by ID', async () => {
    const user = await prisma.user.create({
      data: { email: 'owner@test.com', isStaff: false },
    })
    const club = await prisma.club.create({
      data: { name: 'Club', slug: 'club', ownerId: user.id },
    })
    const recurringEvent = await prisma.recurringEvent.create({
      data: {
        title: 'Weekly Run',
        slug: 'weekly-run',
        address: 'Test Address',
        schedulePattern: 'FREQ=WEEKLY;BYDAY=TU',
        clubId: club.id,
      },
    })

    const request = new Request(
      `http://localhost/api/recurring-events/${recurringEvent.id}`,
      { method: 'GET' }
    )

    const response = await GET(request, {
      params: Promise.resolve({ id: recurringEvent.id }),
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.id).toBe(recurringEvent.id)
    expect(data.title).toBe('Weekly Run')
  })

  it('returns 404 when recurring event not found', async () => {
    const fakeId = 'nonexistent'
    const request = new Request(
      `http://localhost/api/recurring-events/${fakeId}`,
      { method: 'GET' }
    )

    const response = await GET(request, {
      params: Promise.resolve({ id: fakeId }),
    })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Not found')
  })
})

describe('PUT /api/recurring-events/[id]', () => {
  beforeEach(async () => {
    await cleanDatabase()
  })

  afterEach(() => {
    mockGetServerSession.mockReset()
  })

  it('updates recurring event when authenticated', async () => {
    const user = await prisma.user.create({
      data: { email: 'owner@test.com', isStaff: false },
    })
    const club = await prisma.club.create({
      data: { name: 'Club', slug: 'club', ownerId: user.id },
    })
    const recurringEvent = await prisma.recurringEvent.create({
      data: {
        title: 'Old Title',
        slug: 'old-title',
        address: 'Old Address',
        schedulePattern: 'FREQ=WEEKLY;BYDAY=TU',
        clubId: club.id,
      },
    })

    mockGetServerSession.mockResolvedValue({
      user: { id: user.id, isStaff: false },
      expires: '2025-01-01',
    })

    const request = new Request(
      `http://localhost/api/recurring-events/${recurringEvent.id}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          id: recurringEvent.id,
          title: 'Updated Title',
          address: 'Updated Address',
        }),
      }
    )

    const response = await PUT(request, {
      params: Promise.resolve({ id: recurringEvent.id }),
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.title).toBe('Updated Title')
    expect(data.address).toBe('Updated Address')
  })

  it('returns 401 when unauthenticated', async () => {
    const user = await prisma.user.create({
      data: { email: 'owner@test.com', isStaff: false },
    })
    const club = await prisma.club.create({
      data: { name: 'Club', slug: 'club', ownerId: user.id },
    })
    const recurringEvent = await prisma.recurringEvent.create({
      data: {
        title: 'Weekly Run',
        slug: 'weekly-run-2',
        address: 'Test Address',
        schedulePattern: 'FREQ=WEEKLY;BYDAY=TU',
        clubId: club.id,
      },
    })

    mockGetServerSession.mockResolvedValue(null)

    const request = new Request(
      `http://localhost/api/recurring-events/${recurringEvent.id}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          id: recurringEvent.id,
          title: 'Updated Title',
        }),
      }
    )

    const response = await PUT(request, {
      params: Promise.resolve({ id: recurringEvent.id }),
    })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Authentication required')
  })

  it('returns 400 with invalid data', async () => {
    const user = await prisma.user.create({
      data: { email: 'owner@test.com', isStaff: false },
    })
    const club = await prisma.club.create({
      data: { name: 'Club', slug: 'club', ownerId: user.id },
    })
    const recurringEvent = await prisma.recurringEvent.create({
      data: {
        title: 'Weekly Run',
        slug: 'weekly-run-3',
        address: 'Test Address',
        schedulePattern: 'FREQ=WEEKLY;BYDAY=TU',
        clubId: club.id,
      },
    })

    mockGetServerSession.mockResolvedValue({
      user: { id: user.id, isStaff: false },
      expires: '2025-01-01',
    })

    const request = new Request(
      `http://localhost/api/recurring-events/${recurringEvent.id}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          id: recurringEvent.id,
          title: '',
        }),
      }
    )

    const response = await PUT(request, {
      params: Promise.resolve({ id: recurringEvent.id }),
    })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBeDefined()
  })
})

describe('DELETE /api/recurring-events/[id]', () => {
  beforeEach(async () => {
    await cleanDatabase()
  })

  afterEach(() => {
    mockGetServerSession.mockReset()
  })

  it('soft deletes recurring event when authenticated', async () => {
    const user = await prisma.user.create({
      data: { email: 'owner@test.com', isStaff: false },
    })
    const club = await prisma.club.create({
      data: { name: 'Club', slug: 'club', ownerId: user.id },
    })
    const recurringEvent = await prisma.recurringEvent.create({
      data: {
        title: 'Weekly Run',
        slug: 'weekly-run-4',
        address: 'Test Address',
        schedulePattern: 'FREQ=WEEKLY;BYDAY=TU',
        clubId: club.id,
      },
    })

    mockGetServerSession.mockResolvedValue({
      user: { id: user.id, isStaff: false },
      expires: '2025-01-01',
    })

    const request = new Request(
      `http://localhost/api/recurring-events/${recurringEvent.id}`,
      { method: 'DELETE' }
    )

    const response = await DELETE(request, {
      params: Promise.resolve({ id: recurringEvent.id }),
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)

    const updated = await prisma.recurringEvent.findUnique({
      where: { id: recurringEvent.id },
    })
    expect(updated?.isActive).toBe(false)
  })

  it('returns 401 when unauthenticated', async () => {
    const user = await prisma.user.create({
      data: { email: 'owner@test.com', isStaff: false },
    })
    const club = await prisma.club.create({
      data: { name: 'Club', slug: 'club', ownerId: user.id },
    })
    const recurringEvent = await prisma.recurringEvent.create({
      data: {
        title: 'Weekly Run',
        slug: 'weekly-run-5',
        address: 'Test Address',
        schedulePattern: 'FREQ=WEEKLY;BYDAY=TU',
        clubId: club.id,
      },
    })

    mockGetServerSession.mockResolvedValue(null)

    const request = new Request(
      `http://localhost/api/recurring-events/${recurringEvent.id}`,
      { method: 'DELETE' }
    )

    const response = await DELETE(request, {
      params: Promise.resolve({ id: recurringEvent.id }),
    })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Authentication required')

    const stillActive = await prisma.recurringEvent.findUnique({
      where: { id: recurringEvent.id },
    })
    expect(stillActive?.isActive).toBe(true)
  })
})
