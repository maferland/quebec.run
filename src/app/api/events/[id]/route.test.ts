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

    const response = await PUT(request, { params: { id: event.id } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.title).toBe('New Title')
  })
})

describe('DELETE /api/events/[id]', () => {
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

    const response = await DELETE(request, { params: { id: event.id } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)

    const deleted = await prisma.event.findUnique({ where: { id: event.id } })
    expect(deleted).toBeNull()
  })
})
