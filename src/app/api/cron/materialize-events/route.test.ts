import { describe, it, expect, beforeEach } from 'vitest'
import { POST } from './route'
import { prisma } from '@/lib/prisma'
import { cleanDatabase } from '@/lib/test-seed'

describe('POST /api/cron/materialize-events', () => {
  beforeEach(async () => {
    await cleanDatabase()
  })

  it('materializes events for active recurring patterns', async () => {
    const user = await prisma.user.create({
      data: { email: 'test@example.com' },
    })
    const org = await prisma.organization.create({
      data: { name: 'Test Org', slug: 'test-org', ownerId: user.id },
    })
    const club = await prisma.club.create({
      data: {
        name: 'Test Club',
        slug: 'test-club',
        ownerId: user.id,
        organizationId: org.id,
      },
    })

    await prisma.recurringEvent.create({
      data: {
        title: 'Tuesday Run',
        address: '123 Main St',
        clubId: club.id,
        schedulePattern: 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0',
        isActive: true,
      },
    })

    const response = await POST()
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.processed).toBeGreaterThan(0)
    expect(json.created).toBeGreaterThan(0)

    const events = await prisma.event.count()
    expect(events).toBeGreaterThan(0)
  })

  it('handles pattern errors gracefully', async () => {
    // Create invalid pattern
    const user = await prisma.user.create({
      data: { email: 'test@example.com' },
    })
    const org = await prisma.organization.create({
      data: { name: 'Test Org', slug: 'test-org', ownerId: user.id },
    })
    const club = await prisma.club.create({
      data: {
        name: 'Test Club',
        slug: 'test-club',
        ownerId: user.id,
        organizationId: org.id,
      },
    })

    await prisma.recurringEvent.create({
      data: {
        title: 'Invalid Run',
        address: '123 Main St',
        clubId: club.id,
        schedulePattern: 'INVALID_PATTERN',
        isActive: true,
      },
    })

    const response = await POST()
    const json = await response.json()

    expect(response.status).toBe(200) // Still 200, but with errors
    expect(json.errors).toBeDefined()
    expect(json.errors.length).toBeGreaterThan(0)
  })
})
