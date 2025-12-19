import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import {
  generateEventsFromRecurring,
  generateAllRecurringEvents,
} from './recurring-events'
import { addDays } from 'date-fns'

describe('generateEventsFromRecurring', () => {
  beforeEach(async () => {
    await prisma.event.deleteMany()
    await prisma.recurringEvent.deleteMany()
    await prisma.club.deleteMany()
    await prisma.organization.deleteMany()
    await prisma.user.deleteMany()
  })

  it('generates events for weekly pattern', async () => {
    const user = await prisma.user.create({
      data: { email: 'test@example.com' },
    })
    const org = await prisma.organization.create({
      data: {
        name: 'Test Org',
        slug: 'test-org',
        ownerId: user.id,
      },
    })
    const club = await prisma.club.create({
      data: {
        name: 'Test Club',
        slug: 'test-club',
        ownerId: user.id,
        organizationId: org.id,
      },
    })

    const recurring = await prisma.recurringEvent.create({
      data: {
        title: 'Tuesday Run',
        address: '123 Main St',
        clubId: club.id,
        schedulePattern: 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0',
        timezone: 'America/Toronto',
      },
    })

    const created = await generateEventsFromRecurring(recurring, 30)

    expect(created).toBeGreaterThan(0)

    const events = await prisma.event.findMany({
      where: { recurringEventId: recurring.id },
      orderBy: { date: 'asc' },
    })

    expect(events.length).toBeGreaterThanOrEqual(3)
    expect(events.length).toBeLessThanOrEqual(5)

    events.forEach((e) => {
      expect(e.date.getDay()).toBe(2) // Tuesday
      expect(e.time).toBe('18:00')
      expect(e.title).toBe('Tuesday Run')
    })
  })

  it('is idempotent - skips existing events', async () => {
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
    const recurring = await prisma.recurringEvent.create({
      data: {
        title: 'Tuesday Run',
        address: '123 Main St',
        clubId: club.id,
        schedulePattern: 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0',
      },
    })

    await generateEventsFromRecurring(recurring, 30)
    const firstCount = await prisma.event.count({
      where: { recurringEventId: recurring.id },
    })

    const created = await generateEventsFromRecurring(recurring, 30)

    expect(created).toBe(0)

    const secondCount = await prisma.event.count({
      where: { recurringEventId: recurring.id },
    })

    expect(secondCount).toBe(firstCount)
  })

  it('respects generateUntil date', async () => {
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

    const until = addDays(new Date(), 14)
    const recurring = await prisma.recurringEvent.create({
      data: {
        title: 'Tuesday Run',
        address: '123 Main St',
        clubId: club.id,
        schedulePattern: 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0',
        generateUntil: until,
      },
    })

    await generateEventsFromRecurring(recurring, 60)

    const events = await prisma.event.findMany({
      where: { recurringEventId: recurring.id },
    })

    expect(events.length).toBeGreaterThanOrEqual(1)
    expect(events.length).toBeLessThanOrEqual(3)

    events.forEach((e) => {
      expect(e.date.getTime()).toBeLessThanOrEqual(until.getTime())
    })
  })
})

describe('generateAllRecurringEvents', () => {
  beforeEach(async () => {
    await prisma.event.deleteMany()
    await prisma.recurringEvent.deleteMany()
    await prisma.club.deleteMany()
    await prisma.organization.deleteMany()
    await prisma.user.deleteMany()
  })

  it('generates events for all active recurring events', async () => {
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

    await prisma.recurringEvent.create({
      data: {
        title: 'Saturday Run',
        address: '456 Oak Ave',
        clubId: club.id,
        schedulePattern: 'FREQ=WEEKLY;BYDAY=SA;BYHOUR=8;BYMINUTE=0',
        isActive: true,
      },
    })

    await prisma.recurringEvent.create({
      data: {
        title: 'Inactive Run',
        address: '789 Elm St',
        clubId: club.id,
        schedulePattern: 'FREQ=WEEKLY;BYDAY=WE;BYHOUR=19;BYMINUTE=0',
        isActive: false,
      },
    })

    const result = await generateAllRecurringEvents(30)

    expect(result.processed).toBe(2)
    expect(result.created).toBeGreaterThan(0)
    expect(result.errors).toHaveLength(0)

    const inactiveEvents = await prisma.event.findMany({
      where: { title: 'Inactive Run' },
    })
    expect(inactiveEvents).toHaveLength(0)
  })

  it('continues batch on individual failures', async () => {
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
        title: 'Valid Run',
        address: '123 Main St',
        clubId: club.id,
        schedulePattern: 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0',
        isActive: true,
      },
    })

    await prisma.recurringEvent.create({
      data: {
        title: 'Invalid Run',
        address: '456 Oak Ave',
        clubId: club.id,
        schedulePattern: 'INVALID_PATTERN',
        isActive: true,
      },
    })

    const result = await generateAllRecurringEvents(30)

    expect(result.processed).toBe(2)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.created).toBeGreaterThan(0)

    const validEvents = await prisma.event.findMany({
      where: { title: 'Valid Run' },
    })
    expect(validEvents.length).toBeGreaterThan(0)
  })
})
