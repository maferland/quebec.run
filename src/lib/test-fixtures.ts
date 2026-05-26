import type { GetAllClubsReturn } from '@/lib/services/clubs'

export const mockClubsData: GetAllClubsReturn[] = [
  {
    id: 'club-test-1',
    name: '6AM Club Test',
    slug: '6am-club-test',
    description: 'Early morning running club for testing',
    stravaSlug: null,
    type: 'ROAD',
    vibe: 'SOCIAL',
    beginnerFriendly: true,
    _count: { recurringEvents: 2 },
  },
  {
    id: 'club-test-2',
    name: 'Quebec Runners Test',
    slug: 'quebec-runners-test',
    description: 'Running club for all levels - test version',
    stravaSlug: null,
    type: 'ROAD',
    vibe: 'TRAINING',
    beginnerFriendly: false,
    _count: { recurringEvents: 1 },
  },
]

export const mockEmptyClubsData: GetAllClubsReturn[] = []

export const mockSingleClub: GetAllClubsReturn = mockClubsData[0]

// API response helpers
export const createMockClubsResponse = (
  clubs: GetAllClubsReturn[] = mockClubsData
) => {
  return clubs
}

export const createMockErrorResponse = () => {
  throw new Error('Test API Error')
}
