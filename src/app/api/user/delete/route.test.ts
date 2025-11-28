import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { POST } from './route'
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

  it('deletes user account immediately', async () => {
    const user = await prisma.user.create({
      data: { email: 'user@test.com' },
    })

    const club = await prisma.club.create({
      data: { name: 'Club', slug: 'club', ownerId: user.id },
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

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)

    // Verify user deleted
    const deletedUser = await prisma.user.findUnique({
      where: { id: user.id },
    })
    expect(deletedUser).toBeNull()

    // Verify cascaded deletions
    const deletedClub = await prisma.club.findUnique({
      where: { id: club.id },
    })
    expect(deletedClub).toBeNull()
  })
})
