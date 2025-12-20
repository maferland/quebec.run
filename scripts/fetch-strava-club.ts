#!/usr/bin/env bun
import { StravaClient } from '../src/lib/strava'

// Strava club URL: https://www.strava.com/clubs/fauxmouvement
// We need to find the numeric club ID
// Try common patterns or let user provide the ID

const clubSlug = 'fauxmouvement'

console.log(`🔍 Searching for Strava club: ${clubSlug}`)
console.log('Note: Strava API requires numeric club ID, not slug')
console.log('')

// For now, we'll need the user to provide the club ID
// They can find it in the Strava URL or by inspecting the club page

const args = process.argv.slice(2)
const clubId = args[0]

if (!clubId) {
  console.error('❌ Please provide the Strava club ID as an argument')
  console.log('')
  console.log('Usage: bun run scripts/fetch-strava-club.ts <club-id>')
  console.log('')
  console.log('To find the club ID:')
  console.log('1. Go to https://www.strava.com/clubs/fauxmouvement')
  console.log('2. Inspect the page or network requests to find the numeric ID')
  console.log(
    '3. Or use the Strava API explorer: https://developers.strava.com/playground/'
  )
  process.exit(1)
}

const client = new StravaClient()

try {
  console.log(`📡 Fetching club data for ID: ${clubId}...`)
  const club = await client.getClub(clubId)

  console.log('\n✅ Club found!')
  console.log('━'.repeat(60))
  console.log(`Name:        ${club.name}`)
  console.log(`ID:          ${club.id}`)
  console.log(`URL:         ${club.url}`)
  console.log(`City:        ${club.city}, ${club.state}, ${club.country}`)
  console.log(`Members:     ${club.member_count}`)
  console.log(`Sport:       ${club.sport_type}`)
  console.log(`Description: ${club.description || '(none)'}`)
  console.log('━'.repeat(60))

  console.log('\n📝 Add to seed.ts:')
  console.log(`
await prisma.club.upsert({
  where: { slug: '${clubSlug}' },
  update: {
    name: '${club.name}',
    description: '${club.description || ''}',
    stravaClubId: '${club.id}',
    stravaSlug: '${clubSlug}',
    isManual: false,
    lastSynced: new Date(),
  },
  create: {
    name: '${club.name}',
    slug: '${clubSlug}',
    description: '${club.description || ''}',
    stravaClubId: '${club.id}',
    stravaSlug: '${clubSlug}',
    isManual: false,
    lastSynced: new Date(),
    ownerId: staffUser.id,
  },
})
  `)
} catch (error) {
  console.error('❌ Error fetching club:', error)
  process.exit(1)
}
