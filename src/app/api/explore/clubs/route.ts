import { getClubsForExplore } from '@/lib/services/clubs'

// This endpoint has no request-dependent inputs. Its collection tag refreshes
// the cached response on a club/address/schedule edit as well as the data.
export const dynamic = 'force-static'
export const revalidate = false

// Let operational failures reach Next's error handling. Returning a normal
// error Response here would store it in the indefinite full-route cache.
export async function GET() {
  return Response.json(await getClubsForExplore())
}
