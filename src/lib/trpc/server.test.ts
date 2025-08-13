import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { appRouter, createTRPCContext } from './server'
import {
  testPrisma,
  setupTestDatabase,
  cleanDatabase,
  seedTestData,
} from '../test-seed'

describe('tRPC routers', () => {
  beforeAll(async () => {
    await setupTestDatabase()
  })

  beforeEach(async () => {
    await cleanDatabase()
    await seedTestData()
  })

  // Create test context without session
  const createTestContext = () => ({
    prisma: testPrisma,
    session: null,
  })

  describe('clubs router', () => {
    it('getAll returns all clubs with runs', async () => {
      const ctx = createTestContext()
      const caller = appRouter.createCaller(ctx)

      const clubs = await caller.clubs.getAll()

      expect(clubs).toHaveLength(1)
      expect(clubs[0]).toMatchObject({
        name: 'Test Running Club',
        description: 'A club for testing purposes',
        address: '123 Test Street, Quebec City',
      })
      expect(clubs[0].runs).toHaveLength(2)
    })

    it('getById returns specific club with runs', async () => {
      const ctx = createTestContext()
      const caller = appRouter.createCaller(ctx)

      // Get the club ID from the seeded data
      const clubs = await testPrisma.club.findFirst()
      expect(clubs).toBeTruthy()

      const club = await caller.clubs.getById(clubs!.id)

      expect(club).toMatchObject({
        name: 'Test Running Club',
        description: 'A club for testing purposes',
      })
      expect(club?.runs).toHaveLength(2)
    })

    it('getById returns null for non-existent club', async () => {
      const ctx = createTestContext()
      const caller = appRouter.createCaller(ctx)

      const club = await caller.clubs.getById('non-existent-id')

      expect(club).toBeNull()
    })
  })

  describe('runs router', () => {
    it('getUpcoming returns future runs with club info', async () => {
      const ctx = createTestContext()
      const caller = appRouter.createCaller(ctx)

      const runs = await caller.runs.getUpcoming()

      expect(runs).toHaveLength(2)
      expect(runs[0]).toMatchObject({
        title: 'Morning Test Run',
        description: 'A test run for the morning',
        distance: '5km',
        pace: '5:00/km',
      })
      expect(runs[0].club).toMatchObject({
        name: 'Test Running Club',
      })
    })

    it('filters out past runs', async () => {
      // Add a past run
      const club = await testPrisma.club.findFirst()
      await testPrisma.run.create({
        data: {
          title: 'Past Run',
          description: 'A run in the past',
          date: new Date('2020-01-01'),
          time: '07:00',
          address: 'Past Street',
          clubId: club!.id,
        },
      })

      const ctx = createTestContext()
      const caller = appRouter.createCaller(ctx)

      const runs = await caller.runs.getUpcoming()

      // Should still only return the 2 future runs
      expect(runs).toHaveLength(2)
      expect(runs.every((run) => run.title !== 'Past Run')).toBe(true)
    })
  })
})
