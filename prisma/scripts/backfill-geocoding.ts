import { PrismaClient } from '@prisma/client'
import { geocodeAddress } from '../../src/lib/services/geocoding'

const prisma = new PrismaClient()

async function backfillGeocoding() {
  console.log('Starting geocoding backfill...')

  // Find events with address but no coordinates
  const events = await prisma.event.findMany({
    where: {
      address: { not: null },
      latitude: null,
      longitude: null,
    },
    select: {
      id: true,
      address: true,
    },
  })

  console.log(`Found ${events.length} events to geocode`)

  let successCount = 0
  let failCount = 0

  for (const event of events) {
    if (!event.address) continue

    console.log(`Geocoding: ${event.address}`)

    const coords = await geocodeAddress(event.address)

    if (coords) {
      await prisma.event.update({
        where: { id: event.id },
        data: {
          latitude: coords.lat,
          longitude: coords.lng,
          geocodedAt: new Date(),
        },
      })
      successCount++
      console.log(`  ✓ Success: ${coords.lat}, ${coords.lng}`)
    } else {
      failCount++
      console.log(`  ✗ Failed to geocode`)
    }

    // Note: geocoding service already rate-limits at 1 req/sec
  }

  console.log('\nBackfill complete!')
  console.log(`Success: ${successCount}`)
  console.log(`Failed: ${failCount}`)

  await prisma.$disconnect()
}

backfillGeocoding().catch((error) => {
  console.error('Backfill failed:', error)
  process.exit(1)
})
