import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { GET, POST } from './route'
import { prisma } from '@/lib/prisma'
import { cleanDatabase } from '@/lib/test-seed'

// Mock next-auth
vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}))

import { getServerSession } from 'next-auth'
const mockGetServerSession = getServerSession as ReturnType<typeof vi.fn>

describe('GET /api/recurring-events', () => {
  beforeEach(async () => {
    await cleanDatabase()
  })

  afterEach(() => {
    mockGetServerSession.mockReset()
  })

  it('returns recurring events for specified club', async () => {
    const user = await prisma.user.create({
      data: { email: 'owner@test.com', isStaff: false },
    })
    const club = await prisma.club.create({
      data: { name: 'Club', slug: 'club', ownerId: user.id },
    })
    await prisma.recurringEvent.create({
      data: {
        title: 'Weekly Run',
        address: 'Test Address',
        schedulePattern: 'FREQ=WEEKLY;BYDAY=TU',
        clubId: club.id,
      },
    })

    const request = new Request(
      `http://localhost/api/recurring-events?clubId=${club.id}`,
      { method: 'GET' }
    )

    const response = await GET(request, { params: Promise.resolve({}) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveLength(1)
    expect(data[0].title).toBe('Weekly Run')
  })

  it('returns empty array when club has no recurring events', async () => {
    const user = await prisma.user.create({
      data: { email: 'owner@test.com', isStaff: false },
    })
    const club = await prisma.club.create({
      data: { name: 'Club', slug: 'club', ownerId: user.id },
    })

    const request = new Request(
      `http://localhost/api/recurring-events?clubId=${club.id}`,
      { method: 'GET' }
    )

    const response = await GET(request, { params: Promise.resolve({}) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveLength(0)
  })

  it('returns 400 when clubId is missing', async () => {
    const request = new Request('http://localhost/api/recurring-events', {
      method: 'GET',
    })

    const response = await GET(request, { params: Promise.resolve({}) })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBeDefined()
  })
})

describe('POST /api/recurring-events', () => {
  beforeEach(async () => {
    await cleanDatabase()
  })

  afterEach(() => {
    mockGetServerSession.mockReset()
  })

  it('creates recurring event when authenticated', async () => {
    const user = await prisma.user.create({
      data: { email: 'owner@test.com', isStaff: false },
    })
    const club = await prisma.club.create({
      data: { name: 'Club', slug: 'club', ownerId: user.id },
    })

    mockGetServerSession.mockResolvedValue({
      user: { id: user.id, isStaff: false },
      expires: '2025-01-01',
    })

    const request = new Request('http://localhost/api/recurring-events', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Weekly Run',
        description: 'Every Tuesday',
        address: 'Test Address',
        distance: '5k',
        pace: '5:30/km',
        clubId: club.id,
        schedulePattern: 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0',
        timezone: 'America/Toronto',
        isActive: true,
      }),
    })

    const response = await POST(request, { params: Promise.resolve({}) })
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.title).toBe('Weekly Run')
    expect(data.schedulePattern).toBe(
      'FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0'
    )
  })

  it('returns 401 when unauthenticated', async () => {
    const user = await prisma.user.create({
      data: { email: 'owner@test.com', isStaff: false },
    })
    const club = await prisma.club.create({
      data: { name: 'Club', slug: 'club', ownerId: user.id },
    })

    mockGetServerSession.mockResolvedValue(null)

    const request = new Request('http://localhost/api/recurring-events', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Weekly Run',
        address: 'Test Address',
        clubId: club.id,
        schedulePattern: 'FREQ=WEEKLY;BYDAY=TU',
      }),
    })

    const response = await POST(request, { params: Promise.resolve({}) })
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Authentication required')
  })

  it('returns 400 with invalid data', async () => {
    const user = await prisma.user.create({
      data: { email: 'owner@test.com', isStaff: false },
    })

    mockGetServerSession.mockResolvedValue({
      user: { id: user.id, isStaff: false },
      expires: '2025-01-01',
    })

    const request = new Request('http://localhost/api/recurring-events', {
      method: 'POST',
      body: JSON.stringify({
        title: '',
        address: 'Test Address',
      }),
    })

    const response = await POST(request, { params: Promise.resolve({}) })
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBeDefined()
  })

  it('applies default values for optional fields', async () => {
    const user = await prisma.user.create({
      data: { email: 'owner@test.com', isStaff: false },
    })
    const club = await prisma.club.create({
      data: { name: 'Club', slug: 'club', ownerId: user.id },
    })

    mockGetServerSession.mockResolvedValue({
      user: { id: user.id, isStaff: false },
      expires: '2025-01-01',
    })

    const request = new Request('http://localhost/api/recurring-events', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Weekly Run',
        address: 'Test Address',
        clubId: club.id,
        schedulePattern: 'FREQ=WEEKLY;BYDAY=TU',
      }),
    })

    const response = await POST(request, { params: Promise.resolve({}) })
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.timezone).toBe('America/Toronto')
    expect(data.isActive).toBe(true)
  })
})
