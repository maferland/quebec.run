import { PrismaClient } from '@prisma/client'
import { env } from './env'
import { execSync } from 'child_process'
import { createSlug } from './utils/slug'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const testPrisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: env.TEST_DATABASE_URL,
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = testPrisma

// Test database utilities
export async function setupTestDatabase() {
  if (!env.TEST_DATABASE_URL) {
    throw new Error('TEST_DATABASE_URL is required for test database setup')
  }

  try {
    // Create test database if it doesn't exist
    execSync('createdb courses_test', { stdio: 'ignore' })
  } catch {
    // Database might already exist, that's fine
  }

  // Run migrations
  try {
    execSync('npx prisma migrate deploy', {
      env: {
        ...process.env,
        DATABASE_URL: env.TEST_DATABASE_URL,
      },
      stdio: 'inherit',
    })
  } catch (error) {
    console.error('Failed to run migrations:', error)
    throw error
  }
}

export async function cleanDatabase() {
  const tablenames = await testPrisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `"public"."${name}"`)
    .join(', ')

  try {
    await testPrisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`)
  } catch (error) {
    console.log({ error })
  }
}

export async function seedTestData() {
  // Clean first
  await cleanDatabase()

  // Create test user - let Prisma generate the CUID
  const testUser = await testPrisma.user.create({
    data: {
      email: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`,
      name: 'Test User',
    },
  })

  // Seed test clubs
  const testClub = await testPrisma.club.create({
    data: {
      name: 'Test Running Club',
      slug: createSlug('Test Running Club'),
      description: 'A club for testing purposes',
      website: 'https://test-club.com',
      ownerId: testUser.id,
    },
  })

  // Seed test events with upcoming dates
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)

  const dayAfterTomorrow = new Date()
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)

  await testPrisma.event.create({
    data: {
      title: 'Morning Test Run',
      description: 'A test run for the morning',
      date: tomorrow,
      time: '07:00',
      address: '456 Run Street, Quebec City',
      distance: '5km',
      pace: '5:00/km',
      clubId: testClub.id,
    },
  })

  await testPrisma.event.create({
    data: {
      title: 'Evening Test Run',
      description: 'A test run for the evening',
      date: dayAfterTomorrow,
      time: '18:00',
      address: '789 Jog Avenue, Quebec City',
      distance: '10km',
      pace: '4:30/km',
      clubId: testClub.id,
    },
  })

  return testClub
}

export async function teardownTestData() {
  await cleanDatabase()
  await testPrisma.$disconnect()
}
