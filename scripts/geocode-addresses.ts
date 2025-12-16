#!/usr/bin/env tsx

import { config } from 'dotenv'
import { PrismaClient } from '../prisma/generated/client/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { geocodeAddress } from '../src/lib/services/geocoding'

config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Parse CLI flags
const args = process.argv.slice(2)
const force = args.includes('--force')
const dryRun = args.includes('--dry-run')

// Cache to prevent duplicate API calls for same address
const geocodeCache = new Map<string, { lat: number; lng: number } | null>()

type Stats = {
  success: number
  failed: number
  total: number
  cached: number
}

async function geocodeEvents(): Promise<Stats> {
  const stats: Stats = { success: 0, failed: 0, total: 0, cached: 0 }

  // Build query based on force flag
  const whereClause = force
    ? { address: { not: null } }
    : {
        address: { not: null },
        OR: [{ latitude: null }, { longitude: null }],
      }

  const events = await prisma.event.findMany({
    where: whereClause,
    select: { id: true, address: true, title: true },
  })

  stats.total = events.length

  if (events.length === 0) {
    console.log('  No events to geocode')
    return stats
  }

  console.log(`  Found ${events.length} event(s) to geocode`)

  for (let i = 0; i < events.length; i++) {
    const event = events[i]
    const progress = `[${i + 1}/${events.length}]`
    const label = event.title || 'Untitled'

    if (!event.address) {
      console.log(`  ${progress} ${label} → No address (skipped) ✗`)
      stats.failed++
      continue
    }

    // Check cache first
    let result: { lat: number; lng: number } | null
    let fromCache = false

    if (geocodeCache.has(event.address)) {
      result = geocodeCache.get(event.address)!
      fromCache = true
      stats.cached++
    } else {
      result = await geocodeAddress(event.address)
      geocodeCache.set(event.address, result)
    }

    if (result) {
      const suffix = fromCache ? '(cached) ✓' : '✓'
      console.log(
        `  ${progress} ${label} → ${result.lat.toFixed(4)}, ${result.lng.toFixed(4)} ${suffix}`
      )
      stats.success++

      if (!dryRun) {
        await prisma.event.update({
          where: { id: event.id },
          data: {
            latitude: result.lat,
            longitude: result.lng,
          },
        })
      }
    } else {
      console.log(`  ${progress} ${label} → Geocoding failed ✗`)
      stats.failed++
    }
  }

  return stats
}

async function geocodeRecurringEvents(): Promise<Stats> {
  const stats: Stats = { success: 0, failed: 0, total: 0, cached: 0 }

  // Build query based on force flag
  const whereClause = force
    ? { address: { not: null } }
    : {
        address: { not: null },
        OR: [{ latitude: null }, { longitude: null }],
      }

  const recurringEvents = await prisma.recurringEvent.findMany({
    where: whereClause,
    select: { id: true, address: true, title: true },
  })

  stats.total = recurringEvents.length

  if (recurringEvents.length === 0) {
    console.log('  No recurring events to geocode')
    return stats
  }

  console.log(`  Found ${recurringEvents.length} recurring event(s) to geocode`)

  for (let i = 0; i < recurringEvents.length; i++) {
    const event = recurringEvents[i]
    const progress = `[${i + 1}/${recurringEvents.length}]`
    const label = event.title || 'Untitled'

    if (!event.address) {
      console.log(`  ${progress} ${label} → No address (skipped) ✗`)
      stats.failed++
      continue
    }

    // Check cache first
    let result: { lat: number; lng: number } | null
    let fromCache = false

    if (geocodeCache.has(event.address)) {
      result = geocodeCache.get(event.address)!
      fromCache = true
      stats.cached++
    } else {
      result = await geocodeAddress(event.address)
      geocodeCache.set(event.address, result)
    }

    if (result) {
      const suffix = fromCache ? '(cached) ✓' : '✓'
      console.log(
        `  ${progress} ${label} → ${result.lat.toFixed(4)}, ${result.lng.toFixed(4)} ${suffix}`
      )
      stats.success++

      if (!dryRun) {
        await prisma.recurringEvent.update({
          where: { id: event.id },
          data: {
            latitude: result.lat,
            longitude: result.lng,
          },
        })
      }
    } else {
      console.log(`  ${progress} ${label} → Geocoding failed ✗`)
      stats.failed++
    }
  }

  return stats
}

async function main() {
  const startTime = Date.now()

  console.log(
    `\nGeocoding mode: ${force ? 'FORCE (all records)' : 'incremental (missing coords only)'}`
  )
  if (dryRun) {
    console.log('DRY RUN - no database changes will be made\n')
  } else {
    console.log('')
  }

  console.log('Processing Events...')
  const eventStats = await geocodeEvents()

  console.log('\nProcessing RecurringEvents...')
  const recurringStats = await geocodeRecurringEvents()

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(0)
  const totalCached = eventStats.cached + recurringStats.cached
  const totalApiCalls = geocodeCache.size

  console.log('\n=== Geocoding Summary ===')
  console.log(
    `Events: ${eventStats.success} succeeded, ${eventStats.failed} failed, ${eventStats.cached} cached`
  )
  console.log(
    `RecurringEvents: ${recurringStats.success} succeeded, ${recurringStats.failed} failed, ${recurringStats.cached} cached`
  )
  console.log(
    `API calls made: ${totalApiCalls} (saved ${totalCached} duplicate calls)`
  )
  console.log(`Total time: ${totalTime}s`)

  await pool.end()
}

main()
  .catch((error) => {
    console.error('\nError:', error)
    process.exit(1)
  })
  .finally(() => {
    process.exit(0)
  })
