import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { GET } from './route'
import { prisma } from '@/lib/prisma'
import { cleanDatabase } from '@/lib/test-seed'

vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}))

import { getServerSession } from 'next-auth'
const mockGetServerSession = getServerSession as ReturnType<typeof vi.fn>

describe('GET /api/user/data', () => {
  beforeEach(async () => {
    await cleanDatabase()
  })

  afterEach(() => {
    mockGetServerSession.mockReset()
  })

  it('exports all user data', async () => {
    const user = await prisma.user.create({
      data: { email: 'user@test.com', name: 'Test' },
    })

    const club = await prisma.club.create({
      data: { name: 'Club', slug: 'club', ownerId: user.id },
    })

    await prisma.event.create({
      data: {
        title: 'Event',
        date: new Date('2025-12-01'),
        time: '10:00',
        clubId: club.id,
      },
    })

    mockGetServerSession.mockResolvedValue({
      user: { id: user.id, isAdmin: false },
      expires: '2025-01-01',
    })

    const request = new Request('http://localhost/api/user/data', {
      method: 'GET',
    })

    const response = await GET(request, { params: Promise.resolve({}) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.user.email).toBe('user@test.com')
    expect(data.clubs).toHaveLength(1)
    expect(data.events).toHaveLength(1)
  })

  it('returns 401 if not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)

    const request = new Request('http://localhost/api/user/data', {
      method: 'GET',
    })

    const response = await GET(request, { params: Promise.resolve({}) })

    expect(response.status).toBe(401)
  })
})
