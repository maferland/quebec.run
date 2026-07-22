/**
 * Backfills neighborhood from lat/lng via Nominatim reverse geocoding.
 * Run: bun run scripts/backfill-neighborhoods.ts
 *
 * Nominatim rate limit: 1 req/sec. This script respects that.
 */
import { config } from 'dotenv'
import { PrismaClient } from '../prisma/generated/client/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

config()

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function reverseGeocode(
  lat: number,
  lng: number
): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=fr`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'quebec.run/1.0 (me@maferland.com)' },
    })
    if (!res.ok) return null
    const data = (await res.json()) as {
      address?: {
        suburb?: string
        neighbourhood?: string
        quarter?: string
        city_district?: string
        district?: string
        borough?: string
        city?: string
        town?: string
      }
    }
    const a = data.address ?? {}
    // Pick the most specific geographic label available
    const neighborhood =
      a.suburb ?? a.neighbourhood ?? a.quarter ?? a.city_district ?? null
    const district = a.district ?? a.borough ?? null
    if (!neighborhood && !district) return null
    return [neighborhood, district].filter(Boolean).join(' · ')
  } catch {
    return null
  }
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function main() {
  // ── RecurringEvents ────────────────────────────────────────────────────────
  const rEvents = await prisma.recurringEvent.findMany({
    where: {
      latitude: { not: null },
      longitude: { not: null },
      neighborhood: null,
    },
    select: { id: true, latitude: true, longitude: true, address: true },
  })
  console.log(`RecurringEvents to process: ${rEvents.length}`)

  for (const re of rEvents) {
    if (re.latitude == null || re.longitude == null) continue
    const neighborhood = await reverseGeocode(re.latitude, re.longitude)
    console.log(`  RE ${re.id}: ${neighborhood ?? '—'} (${re.address})`)
    await prisma.recurringEvent.update({
      where: { id: re.id },
      data: { neighborhood },
    })
    await sleep(1100) // Nominatim 1 req/sec
  }

  // ── Concrete Events ────────────────────────────────────────────────────────
  const events = await prisma.event.findMany({
    where: {
      latitude: { not: null },
      longitude: { not: null },
      neighborhood: null,
    },
    select: { id: true, latitude: true, longitude: true, address: true },
  })
  console.log(`\nEvents to process: ${events.length}`)

  for (const ev of events) {
    if (ev.latitude == null || ev.longitude == null) continue
    const neighborhood = await reverseGeocode(ev.latitude, ev.longitude)
    console.log(`  EV ${ev.id}: ${neighborhood ?? '—'} (${ev.address})`)
    await prisma.event.update({
      where: { id: ev.id },
      data: { neighborhood },
    })
    await sleep(1100)
  }

  console.log('\nDone.')
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
