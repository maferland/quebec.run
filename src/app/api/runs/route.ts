import { NextRequest } from 'next/server'
import { getQueryParams, withErrorHandler } from '@/lib/route-helpers'

// Temporary implementation until we create the runs service
async function getUpcomingRuns() {
  // For now, return empty array - we'll implement the full runs service later
  return []
}

export const GET = withErrorHandler(async (request: NextRequest) => {
  const queryData = getQueryParams(request)
  const runs = await getUpcomingRuns()
  return Response.json(runs)
})