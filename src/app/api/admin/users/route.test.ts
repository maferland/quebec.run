import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { GET } from './route'
import { PATCH } from './[id]/route'
import { prisma } from '@/lib/prisma'
import { cleanDatabase } from '@/lib/test-seed'

// Mock next-auth
vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}))

import { getServerSession } from 'next-auth'
const mockGetServerSession = getServerSession as ReturnType<typeof vi.fn>

describe('User API Routes', () => {
  let adminUser: { id: string; email: string; isStaff: boolean }
  let testUser: { id: string; email: string; isStaff: boolean }

  beforeEach(async () => {
    await cleanDatabase()

    adminUser = await prisma.user.create({
      data: { email: 'admin@test.com', isStaff: true },
      select: { id: true, email: true, isStaff: true },
    })

    testUser = await prisma.user.create({
      data: { email: 'user@test.com', isStaff: false },
      select: { id: true, email: true, isStaff: true },
    })
  })

  afterEach(() => {
    mockGetServerSession.mockReset()
  })

  describe('GET /api/admin/users', () => {
    it('returns all users for admin', async () => {
      // Mock admin session
      mockGetServerSession.mockResolvedValue({
        user: { id: adminUser.id, isStaff: true },
        expires: '2025-01-01',
      })

      const request = new Request('http://localhost/api/admin/users')
      const response = await GET(request, { params: Promise.resolve({}) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveLength(2)
    })

    it('returns 403 for non-admin', async () => {
      // Mock non-admin session
      mockGetServerSession.mockResolvedValue({
        user: { id: testUser.id, isStaff: false },
        expires: '2025-01-01',
      })

      const request = new Request('http://localhost/api/admin/users')
      const response = await GET(request, { params: Promise.resolve({}) })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Unauthorized')
    })

    it('returns 401 when unauthenticated', async () => {
      // Mock no session
      mockGetServerSession.mockResolvedValue(null)

      const request = new Request('http://localhost/api/admin/users')
      const response = await GET(request, { params: Promise.resolve({}) })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
    })
  })

  describe('PATCH /api/admin/users/[id]', () => {
    it('toggles admin status', async () => {
      // Mock admin session
      mockGetServerSession.mockResolvedValue({
        user: { id: adminUser.id, isStaff: true },
        expires: '2025-01-01',
      })

      const request = new Request(
        'http://localhost/api/admin/users/' + testUser.id,
        {
          method: 'PATCH',
          body: JSON.stringify({ id: testUser.id, isStaff: true }),
        }
      )

      const response = await PATCH(request, {
        params: Promise.resolve({ id: testUser.id }),
      })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.isStaff).toBe(true)
    })

    it('returns 403 for non-admin', async () => {
      // Mock non-admin session
      mockGetServerSession.mockResolvedValue({
        user: { id: testUser.id, isStaff: false },
        expires: '2025-01-01',
      })

      const request = new Request(
        'http://localhost/api/admin/users/' + adminUser.id,
        {
          method: 'PATCH',
          body: JSON.stringify({ id: adminUser.id, isStaff: false }),
        }
      )

      const response = await PATCH(request, {
        params: Promise.resolve({ id: adminUser.id }),
      })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Unauthorized')
    })

    it('returns 401 when unauthenticated', async () => {
      // Mock no session
      mockGetServerSession.mockResolvedValue(null)

      const request = new Request(
        'http://localhost/api/admin/users/' + testUser.id,
        {
          method: 'PATCH',
          body: JSON.stringify({ id: testUser.id, isStaff: true }),
        }
      )

      const response = await PATCH(request, {
        params: Promise.resolve({ id: testUser.id }),
      })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
    })
  })
})
