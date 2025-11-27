import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { POST, GET } from './route'
import { prisma } from '@/lib/prisma'
import { cleanDatabase } from '@/lib/test-seed'

vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}))

import { getServerSession } from 'next-auth'
const mockGetServerSession = getServerSession as ReturnType<typeof vi.fn>

describe('POST /api/user/delete', () => {
  beforeEach(async () => {
    await cleanDatabase()
  })

  afterEach(() => {
    mockGetServerSession.mockReset()
  })

  it('creates deletion request', async () => {
    const user = await prisma.user.create({
      data: { email: 'user@test.com' },
    })

    mockGetServerSession.mockResolvedValue({
      user: { id: user.id, isAdmin: false },
      expires: '2025-01-01',
    })

    const request = new Request('http://localhost/api/user/delete', {
      method: 'POST',
    })

    const response = await POST(request, { params: Promise.resolve({}) })
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.requestId).toBeDefined()
    expect(data.scheduledFor).toBeDefined()

    const req = await prisma.dataDeletionRequest.findFirst({
      where: { userId: user.id },
    })
    expect(req?.status).toBe('pending')
  })

  it('returns 400 if pending request exists', async () => {
    const user = await prisma.user.create({
      data: { email: 'user@test.com' },
    })

    await prisma.dataDeletionRequest.create({
      data: {
        userId: user.id,
        scheduledFor: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    })

    mockGetServerSession.mockResolvedValue({
      user: { id: user.id, isAdmin: false },
      expires: '2025-01-01',
    })

    const request = new Request('http://localhost/api/user/delete', {
      method: 'POST',
    })

    const response = await POST(request, { params: Promise.resolve({}) })

    expect(response.status).toBe(400)
  })
})

describe('GET /api/user/delete', () => {
  beforeEach(async () => {
    await cleanDatabase()
  })

  afterEach(() => {
    mockGetServerSession.mockReset()
  })

  it('returns pending request', async () => {
    const user = await prisma.user.create({
      data: { email: 'user@test.com' },
    })

    await prisma.dataDeletionRequest.create({
      data: {
        userId: user.id,
        scheduledFor: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    })

    mockGetServerSession.mockResolvedValue({
      user: { id: user.id, isAdmin: false },
      expires: '2025-01-01',
    })

    const request = new Request('http://localhost/api/user/delete', {
      method: 'GET',
    })

    const response = await GET(request, { params: Promise.resolve({}) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.hasPendingRequest).toBe(true)
    expect(data.request).toBeDefined()
  })

  it('returns null if no pending request', async () => {
    const user = await prisma.user.create({
      data: { email: 'user@test.com' },
    })

    mockGetServerSession.mockResolvedValue({
      user: { id: user.id, isAdmin: false },
      expires: '2025-01-01',
    })

    const request = new Request('http://localhost/api/user/delete', {
      method: 'GET',
    })

    const response = await GET(request, { params: Promise.resolve({}) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.hasPendingRequest).toBe(false)
  })
})
