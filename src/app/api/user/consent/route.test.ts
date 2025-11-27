import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { POST, GET } from './route'
import { prisma } from '@/lib/prisma'
import { cleanDatabase } from '@/lib/test-seed'

// Mock next-auth
vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}))

import { getServerSession } from 'next-auth'
const mockGetServerSession = getServerSession as ReturnType<typeof vi.fn>

describe('POST /api/user/consent', () => {
  beforeEach(async () => {
    await cleanDatabase()
  })

  afterEach(() => {
    mockGetServerSession.mockReset()
  })

  it('creates consent with IP', async () => {
    const user = await prisma.user.create({
      data: { email: 'user@test.com' },
    })

    mockGetServerSession.mockResolvedValue({
      user: { id: user.id, isAdmin: false },
      expires: '2025-01-01',
    })

    const request = new Request('http://localhost/api/user/consent', {
      method: 'POST',
      headers: { 'x-forwarded-for': '192.168.1.1' },
    })

    const response = await POST(request, { params: Promise.resolve({}) })
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.consentId).toBeDefined()

    const consent = await prisma.userConsent.findUnique({
      where: { userId: user.id },
    })
    expect(consent?.ipAddress).toBe('192.168.1.1')
  })

  it('returns 401 if not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null)

    const request = new Request('http://localhost/api/user/consent', {
      method: 'POST',
    })

    const response = await POST(request, { params: Promise.resolve({}) })

    expect(response.status).toBe(401)
  })

  it('returns 400 if consent exists', async () => {
    const user = await prisma.user.create({
      data: { email: 'user@test.com' },
    })

    await prisma.userConsent.create({
      data: { userId: user.id },
    })

    mockGetServerSession.mockResolvedValue({
      user: { id: user.id, isAdmin: false },
      expires: '2025-01-01',
    })

    const request = new Request('http://localhost/api/user/consent', {
      method: 'POST',
    })

    const response = await POST(request, { params: Promise.resolve({}) })

    expect(response.status).toBe(400)
  })
})

describe('GET /api/user/consent', () => {
  beforeEach(async () => {
    await cleanDatabase()
  })

  afterEach(() => {
    mockGetServerSession.mockReset()
  })

  it('returns consent if exists', async () => {
    const user = await prisma.user.create({
      data: { email: 'user@test.com' },
    })

    await prisma.userConsent.create({
      data: { userId: user.id, ipAddress: '192.168.1.1' },
    })

    mockGetServerSession.mockResolvedValue({
      user: { id: user.id, isAdmin: false },
      expires: '2025-01-01',
    })

    const request = new Request('http://localhost/api/user/consent', {
      method: 'GET',
    })

    const response = await GET(request, { params: Promise.resolve({}) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.hasConsent).toBe(true)
    expect(data.consent).toBeDefined()
  })

  it('returns null if no consent', async () => {
    const user = await prisma.user.create({
      data: { email: 'user@test.com' },
    })

    mockGetServerSession.mockResolvedValue({
      user: { id: user.id, isAdmin: false },
      expires: '2025-01-01',
    })

    const request = new Request('http://localhost/api/user/consent', {
      method: 'GET',
    })

    const response = await GET(request, { params: Promise.resolve({}) })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.hasConsent).toBe(false)
    expect(data.consent).toBeNull()
  })
})
