import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { DELETE } from './route'
import { prisma } from '@/lib/prisma'
import { cleanDatabase } from '@/lib/test-seed'

vi.mock('next-auth', () => ({
  default: vi.fn(),
  getServerSession: vi.fn(),
}))

import { getServerSession } from 'next-auth'
const mockGetServerSession = getServerSession as ReturnType<typeof vi.fn>

describe('DELETE /api/user/delete/[id]', () => {
  beforeEach(async () => {
    await cleanDatabase()
  })

  afterEach(() => {
    mockGetServerSession.mockReset()
  })

  it('cancels deletion request', async () => {
    const user = await prisma.user.create({
      data: { email: 'user@test.com' },
    })

    const request = await prisma.dataDeletionRequest.create({
      data: {
        userId: user.id,
        scheduledFor: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    })

    mockGetServerSession.mockResolvedValue({
      user: { id: user.id, isAdmin: false },
      expires: '2025-01-01',
    })

    const req = new Request(
      `http://localhost/api/user/delete/${request.id}`,
      {
        method: 'DELETE',
      }
    )

    const response = await DELETE(req, {
      params: Promise.resolve({ id: request.id }),
    })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)

    const cancelled = await prisma.dataDeletionRequest.findUnique({
      where: { id: request.id },
    })
    expect(cancelled?.status).toBe('cancelled')
  })

  it('returns 404 if request not found', async () => {
    const user = await prisma.user.create({
      data: { email: 'user@test.com' },
    })

    mockGetServerSession.mockResolvedValue({
      user: { id: user.id, isAdmin: false },
      expires: '2025-01-01',
    })

    const req = new Request('http://localhost/api/user/delete/invalid', {
      method: 'DELETE',
    })

    const response = await DELETE(req, {
      params: Promise.resolve({ id: 'invalid' }),
    })

    expect(response.status).toBe(400)
  })
})
