import { withPublic } from '@/lib/api-middleware'
import { stravaClubIdSchema } from '@/lib/schemas'
import { StravaClient } from '@/lib/strava'

// GET /api/strava/clubs/:clubId
// Fetches club data from Strava API (no DB save)
export const GET = withPublic(stravaClubIdSchema)(async (data) => {
  const client = new StravaClient()

  try {
    const club = await client.getClub(data.clubId)

    // Transform to match our schema
    return Response.json({
      id: club.id,
      name: club.name,
      description: club.description || '',
      url: club.url,
      memberCount: club.member_count,
      location: `${club.city}, ${club.state}, ${club.country}`,
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      return Response.json(
        { error: 'Club not found on Strava' },
        { status: 404 }
      )
    }
    if (error instanceof Error && error.message.includes('401')) {
      return Response.json(
        { error: 'Strava authentication failed' },
        { status: 401 }
      )
    }
    throw error
  }
})
