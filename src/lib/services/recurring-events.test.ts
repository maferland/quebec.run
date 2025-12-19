import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import {
  generateEventsFromRecurring,
  generateAllRecurringEvents,
  expandRRuleDates,
  createVirtualEvent,
  getEventsInRange,
  createRecurringEvent,
  updateRecurringEvent,
  deleteRecurringEvent,
  getRecurringEventById,
  getRecurringEventsByClub,
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

describe('Hybrid query helpers', () => {
  beforeEach(async () => {
    await prisma.event.deleteMany()
    await prisma.recurringEvent.deleteMany()
    await prisma.club.deleteMany()
    await prisma.organization.deleteMany()
    await prisma.user.deleteMany()
  })

  describe('expandRRuleDates', () => {
    it('expands weekly pattern for date range', () => {
      const pattern = 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0'
      const start = new Date('2025-12-01')
      const end = new Date('2025-12-31')

      const dates = expandRRuleDates(pattern, start, end)

      expect(dates.length).toBeGreaterThanOrEqual(2)
      dates.forEach((d) => expect(d.getDay()).toBe(2)) // Tuesday
    })

    it('returns empty array for dates outside pattern range', () => {
      const pattern = 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0;UNTIL=20251220'
      const start = new Date('2025-12-25')
      const end = new Date('2025-12-31')

      const dates = expandRRuleDates(pattern, start, end)

      expect(dates).toHaveLength(0)
    })
  })

  describe('createVirtualEvent', () => {
    it('creates virtual event from recurring pattern', async () => {
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
          description: 'Weekly run',
          address: '123 Main St',
          distance: '5km',
          clubId: club.id,
          schedulePattern: 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0',
        },
        include: { club: true },
      })

      const date = new Date('2025-12-24T18:00:00')
      const virtual = createVirtualEvent(recurring, date)

      expect(virtual.id).toContain(recurring.id)
      expect(virtual.id).toContain('2025-12-24')
      expect(virtual.title).toBe('Tuesday Run')
      expect(virtual.description).toBe('Weekly run')
      expect(virtual.address).toBe('123 Main St')
      expect(virtual.distance).toBe('5km')
      expect(virtual.date).toEqual(date)
      expect(virtual.time).toBe('18:00')
      expect(virtual.recurringEventId).toBe(recurring.id)
      expect(virtual.club).toEqual({
        id: club.id,
        name: club.name,
        slug: club.slug,
      })
    })
  })
})

describe('getEventsInRange', () => {
  beforeEach(async () => {
    await prisma.event.deleteMany()
    await prisma.recurringEvent.deleteMany()
    await prisma.club.deleteMany()
    await prisma.organization.deleteMany()
    await prisma.user.deleteMany()
  })

  it('returns concrete events only when no recurring patterns', async () => {
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

    await prisma.event.create({
      data: {
        title: 'One-time Event',
        date: new Date('2025-12-20'),
        time: '18:00',
        address: '123 Main St',
        clubId: club.id,
      },
    })

    const start = new Date('2025-12-15')
    const end = new Date('2025-12-31')
    const events = await getEventsInRange(start, end)

    expect(events).toHaveLength(1)
    expect(events[0].title).toBe('One-time Event')
  })

  it('returns hybrid mix of concrete and virtual events', async () => {
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

    // Create recurring pattern (weekly Tuesdays)
    const recurring = await prisma.recurringEvent.create({
      data: {
        title: 'Tuesday Run',
        address: '123 Main St',
        clubId: club.id,
        schedulePattern: 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0',
        isActive: true,
      },
    })

    // Materialize first Tuesday only
    await prisma.event.create({
      data: {
        title: 'Tuesday Run',
        date: new Date('2025-12-23'),
        time: '18:00',
        address: '123 Main St',
        clubId: club.id,
        recurringEventId: recurring.id,
      },
    })

    const start = new Date('2025-12-15')
    const end = new Date('2025-12-31')
    const events = await getEventsInRange(start, end)

    // Should have: 1 concrete (Dec 23) + 1 virtual (Dec 30)
    expect(events.length).toBeGreaterThanOrEqual(2)

    const dec23 = events.find(
      (e) => e.date.toISOString().split('T')[0] === '2025-12-23'
    )
    const dec30 = events.find(
      (e) => e.date.toISOString().split('T')[0] === '2025-12-30'
    )

    expect(dec23).toBeDefined()
    expect(dec30).toBeDefined()
    expect(dec23?.id).not.toContain(':') // Concrete (DB ID)
    expect(dec30?.id).toContain(':') // Virtual (composite ID)
  })

  it('excludes paused recurring patterns', async () => {
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
        title: 'Paused Run',
        address: '123 Main St',
        clubId: club.id,
        schedulePattern: 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0',
        isActive: false,
      },
    })

    const start = new Date('2025-12-15')
    const end = new Date('2025-12-31')
    const events = await getEventsInRange(start, end)

    expect(events).toHaveLength(0)
  })

  it('excludes cancelled concrete events', async () => {
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

    await prisma.event.create({
      data: {
        title: 'Cancelled Event',
        date: new Date('2025-12-20'),
        time: '18:00',
        address: '123 Main St',
        clubId: club.id,
        status: 'CANCELLED',
      },
    })

    const start = new Date('2025-12-15')
    const end = new Date('2025-12-31')
    const events = await getEventsInRange(start, end)

    expect(events).toHaveLength(0)
  })
})

describe('CRUD operations', () => {
  beforeEach(async () => {
    await prisma.event.deleteMany()
    await prisma.recurringEvent.deleteMany()
    await prisma.club.deleteMany()
    await prisma.organization.deleteMany()
    await prisma.user.deleteMany()
  })

  describe('createRecurringEvent', () => {
    it('creates recurring event', async () => {
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

      const data = {
        title: 'Tuesday Run',
        address: '123 Main St',
        clubId: club.id,
        schedulePattern: 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0',
      }

      const result = await createRecurringEvent(data)

      expect(result.id).toBeDefined()
      expect(result.title).toBe('Tuesday Run')
      expect(result.isActive).toBe(true)
      expect(result.timezone).toBe('America/Toronto')
    })
  })

  describe('updateRecurringEvent', () => {
    it('updates recurring event', async () => {
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
          title: 'Old Title',
          address: '123 Main St',
          clubId: club.id,
          schedulePattern: 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0',
        },
      })

      const updated = await updateRecurringEvent(recurring.id, {
        title: 'New Title',
        address: '456 Oak Ave',
      })

      expect(updated.title).toBe('New Title')
      expect(updated.address).toBe('456 Oak Ave')
    })
  })

  describe('deleteRecurringEvent', () => {
    it('soft deletes recurring event', async () => {
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

      await deleteRecurringEvent(recurring.id)

      const deleted = await prisma.recurringEvent.findUnique({
        where: { id: recurring.id },
      })
      expect(deleted?.isActive).toBe(false)
    })
  })

  describe('getRecurringEventById', () => {
    it('returns recurring event with club relation', async () => {
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

      const result = await getRecurringEventById(recurring.id)

      expect(result?.id).toBe(recurring.id)
      expect(result?.club.name).toBe('Test Club')
    })

    it('returns null if not found', async () => {
      const result = await getRecurringEventById('nonexistent')
      expect(result).toBeNull()
    })
  })

  describe('getRecurringEventsByClub', () => {
    it('returns recurring events for club', async () => {
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
        },
      })

      await prisma.recurringEvent.create({
        data: {
          title: 'Saturday Run',
          address: '456 Oak Ave',
          clubId: club.id,
          schedulePattern: 'FREQ=WEEKLY;BYDAY=SA;BYHOUR=8;BYMINUTE=0',
        },
      })

      const results = await getRecurringEventsByClub(club.id)

      expect(results).toHaveLength(2)
      expect(results[0].club.name).toBe('Test Club')
    })
  })
})
