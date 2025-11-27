import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PUT, DELETE } from './route'
import { prisma } from '@/lib/prisma'
import { cleanDatabase } from '@/lib/test-seed'

// Mock next-auth
vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}))

import { getServerSession } from 'next-auth'
const mockGetServerSession = getServerSession as ReturnType<typeof vi.fn>

describe('PUT /api/events/[id]', () => {
  beforeEach(async () => {
    await cleanDatabase()
  })

  afterEach(() => {
    mockGetServerSession.mockReset()
  })

  it('updates event with valid data', async () => {
    const user = await prisma.user.create({
      data: { email: 'admin@test.com', isAdmin: true },
    })
    const club = await prisma.club.create({
      data: { name: 'Club', slug: 'club', ownerId: user.id },
    })
    const event = await prisma.event.create({
      data: {
        title: 'Old',
        date: new Date('2025-12-01'),
        time: '10:00',
        address: 'Old Address',
        clubId: club.id,
      },
    })

    // Mock session
    mockGetServerSession.mockResolvedValue({
      user: { id: user.id, isAdmin: true },
      expires: '2025-01-01',
    })

    const request = new Request('http://localhost/api/events/' + event.id, {
      method: 'PUT',
      body: JSON.stringify({
        id: event.id,
        title: 'New Title',
        date: '2025-12-02',
        time: '11:00',
        address: 'New Address',
        clubId: club.id,
      }),
    })

    const response = await PUT(request, {
      params: Promise.resolve({ id: event.id }),
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.title).toBe('New Title')
  })

  it('returns 401 when unauthenticated', async () => {
    const user = await prisma.user.create({
      data: { email: 'owner@test.com', isAdmin: false },
    })
    const club = await prisma.club.create({
      data: { name: 'Club', slug: 'club', ownerId: user.id },
    })
    const event = await prisma.event.create({
      data: {
        title: 'Event',
        date: new Date('2025-12-01'),
        time: '10:00',
        address: 'Address',
        clubId: club.id,
      },
    })

    // Mock no session
    mockGetServerSession.mockResolvedValue(null)

    const request = new Request('http://localhost/api/events/' + event.id, {
      method: 'PUT',
      body: JSON.stringify({
        id: event.id,
        title: 'Updated',
        date: '2025-12-02',
        time: '11:00',
        address: 'Updated Address',
        clubId: club.id,
      }),
    })

    const response = await PUT(request, {
      params: Promise.resolve({ id: event.id }),
    })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Authentication required')
  })

  it('returns 403 when user does not own club and is not admin', async () => {
    const owner = await prisma.user.create({
      data: { email: 'owner@test.com', isAdmin: false },
    })
    const otherUser = await prisma.user.create({
      data: { email: 'other@test.com', isAdmin: false },
    })
    const club = await prisma.club.create({
      data: { name: 'Club', slug: 'club', ownerId: owner.id },
    })
    const event = await prisma.event.create({
      data: {
        title: 'Event',
        date: new Date('2025-12-01'),
        time: '10:00',
        address: 'Address',
        clubId: club.id,
      },
    })

    // Mock session as other user (not owner, not admin)
    mockGetServerSession.mockResolvedValue({
      user: { id: otherUser.id, isAdmin: false },
      expires: '2025-01-01',
    })

    const request = new Request('http://localhost/api/events/' + event.id, {
      method: 'PUT',
      body: JSON.stringify({
        id: event.id,
        title: 'Updated',
        date: '2025-12-02',
        time: '11:00',
        address: 'Updated Address',
        clubId: club.id,
      }),
    })

    const response = await PUT(request, {
      params: Promise.resolve({ id: event.id }),
    })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Unauthorized')
  })

  it('allows club owner to update their event', async () => {
    const owner = await prisma.user.create({
      data: { email: 'owner@test.com', isAdmin: false },
    })
    const club = await prisma.club.create({
      data: { name: 'Club', slug: 'club', ownerId: owner.id },
    })
    const event = await prisma.event.create({
      data: {
        title: 'Original',
        date: new Date('2025-12-01'),
        time: '10:00',
        address: 'Original Address',
        clubId: club.id,
      },
    })

    // Mock session as club owner
    mockGetServerSession.mockResolvedValue({
      user: { id: owner.id, isAdmin: false },
      expires: '2025-01-01',
    })

    const request = new Request('http://localhost/api/events/' + event.id, {
      method: 'PUT',
      body: JSON.stringify({
        id: event.id,
        title: 'Updated by Owner',
        date: '2025-12-02',
        time: '11:00',
        address: 'Updated Address',
        clubId: club.id,
      }),
    })

    const response = await PUT(request, {
      params: Promise.resolve({ id: event.id }),
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.title).toBe('Updated by Owner')
  })

  it('returns 404 when event not found', async () => {
    const user = await prisma.user.create({
      data: { email: 'admin@test.com', isAdmin: true },
    })
    const club = await prisma.club.create({
      data: { name: 'Club', slug: 'club', ownerId: user.id },
    })

    // Mock session
    mockGetServerSession.mockResolvedValue({
      user: { id: user.id, isAdmin: true },
      expires: '2025-01-01',
    })

    const fakeEventId = 'nonexistent'
    const request = new Request('http://localhost/api/events/' + fakeEventId, {
      method: 'PUT',
      body: JSON.stringify({
        id: fakeEventId,
        title: 'Updated',
        date: '2025-12-02',
        time: '11:00',
        address: 'Address',
        clubId: club.id,
      }),
    })

    const response = await PUT(request, {
      params: Promise.resolve({ id: fakeEventId }),
    })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Event not found')
  })
})

describe('DELETE /api/events/[id]', () => {
  beforeEach(async () => {
    await cleanDatabase()
  })

  afterEach(() => {
    mockGetServerSession.mockReset()
  })

  it('deletes event when authorized', async () => {
    const user = await prisma.user.create({
      data: { email: 'admin2@test.com', isAdmin: true },
    })
    const club = await prisma.club.create({
      data: { name: 'Club2', slug: 'club2', ownerId: user.id },
    })
    const event = await prisma.event.create({
      data: {
        title: 'Event',
        date: new Date('2025-12-01'),
        time: '10:00',
        address: 'Address',
        clubId: club.id,
      },
    })

    // Mock session
    mockGetServerSession.mockResolvedValue({
      user: { id: user.id, isAdmin: true },
      expires: '2025-01-01',
    })

    const request = new Request('http://localhost/api/events/' + event.id, {
      method: 'DELETE',
    })

    const response = await DELETE(request, {
      params: Promise.resolve({ id: event.id }),
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)

    const deleted = await prisma.event.findUnique({ where: { id: event.id } })
    expect(deleted).toBeNull()
  })

  it('returns 401 when unauthenticated', async () => {
    const user = await prisma.user.create({
      data: { email: 'owner@test.com', isAdmin: false },
    })
    const club = await prisma.club.create({
      data: { name: 'Club', slug: 'club', ownerId: user.id },
    })
    const event = await prisma.event.create({
      data: {
        title: 'Event',
        date: new Date('2025-12-01'),
        time: '10:00',
        address: 'Address',
        clubId: club.id,
      },
    })

    // Mock no session
    mockGetServerSession.mockResolvedValue(null)

    const request = new Request('http://localhost/api/events/' + event.id, {
      method: 'DELETE',
    })

    const response = await DELETE(request, {
      params: Promise.resolve({ id: event.id }),
    })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Authentication required')

    // Verify event was not deleted
    const stillExists = await prisma.event.findUnique({
      where: { id: event.id },
    })
    expect(stillExists).not.toBeNull()
  })

  it('returns 403 when user does not own club and is not admin', async () => {
    const owner = await prisma.user.create({
      data: { email: 'owner@test.com', isAdmin: false },
    })
    const otherUser = await prisma.user.create({
      data: { email: 'other@test.com', isAdmin: false },
    })
    const club = await prisma.club.create({
      data: { name: 'Club', slug: 'club', ownerId: owner.id },
    })
    const event = await prisma.event.create({
      data: {
        title: 'Event',
        date: new Date('2025-12-01'),
        time: '10:00',
        address: 'Address',
        clubId: club.id,
      },
    })

    // Mock session as other user (not owner, not admin)
    mockGetServerSession.mockResolvedValue({
      user: { id: otherUser.id, isAdmin: false },
      expires: '2025-01-01',
    })

    const request = new Request('http://localhost/api/events/' + event.id, {
      method: 'DELETE',
    })

    const response = await DELETE(request, {
      params: Promise.resolve({ id: event.id }),
    })
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.error).toBe('Unauthorized')

    // Verify event was not deleted
    const stillExists = await prisma.event.findUnique({
      where: { id: event.id },
    })
    expect(stillExists).not.toBeNull()
  })

  it('allows club owner to delete their event', async () => {
    const owner = await prisma.user.create({
      data: { email: 'owner@test.com', isAdmin: false },
    })
    const club = await prisma.club.create({
      data: { name: 'Club', slug: 'club', ownerId: owner.id },
    })
    const event = await prisma.event.create({
      data: {
        title: 'Event',
        date: new Date('2025-12-01'),
        time: '10:00',
        address: 'Address',
        clubId: club.id,
      },
    })

    // Mock session as club owner
    mockGetServerSession.mockResolvedValue({
      user: { id: owner.id, isAdmin: false },
      expires: '2025-01-01',
    })

    const request = new Request('http://localhost/api/events/' + event.id, {
      method: 'DELETE',
    })

    const response = await DELETE(request, {
      params: Promise.resolve({ id: event.id }),
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)

    // Verify event was deleted
    const deleted = await prisma.event.findUnique({ where: { id: event.id } })
    expect(deleted).toBeNull()
  })

  it('returns 404 when event not found', async () => {
    const user = await prisma.user.create({
      data: { email: 'admin@test.com', isAdmin: true },
    })

    // Mock session
    mockGetServerSession.mockResolvedValue({
      user: { id: user.id, isAdmin: true },
      expires: '2025-01-01',
    })

    const fakeEventId = 'nonexistent'
    const request = new Request('http://localhost/api/events/' + fakeEventId, {
      method: 'DELETE',
    })

    const response = await DELETE(request, {
      params: Promise.resolve({ id: fakeEventId }),
    })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Event not found')
  })
})
