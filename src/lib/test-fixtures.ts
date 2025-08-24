import type { GetAllClubsReturn } from '@/lib/services/clubs'

export const mockClubsData: GetAllClubsReturn[] = [
  {
    id: 'club-test-1',
    name: '6AM Club Test',
    slug: '6am-club-test',
    description: 'Early morning running club for testing',
    events: [
      {
        id: 'event-test-1',
        title: '6AM Club Limoilou Test Run',
        date: new Date('2025-01-24T06:00:00.000Z'),
        time: '06:00',
        distance: '5-8 km',
        pace: 'Rythme modéré',
      },
      {
        id: 'event-test-2',
        title: '6AM Club Saint-Jean Test Run',
        date: new Date('2025-01-25T06:00:00.000Z'),
        time: '06:00',
        distance: '3-5 km',
        pace: 'Rythme facile',
      },
    ],
  },
  {
    id: 'club-test-2',
    name: 'Quebec Runners Test',
    slug: 'quebec-runners-test',
    description: 'Running club for all levels - test version',
    events: [
      {
        id: 'event-test-3',
        title: 'Evening Run Test',
        date: new Date('2025-01-26T18:00:00.000Z'),
        time: '18:00',
        distance: '10 km',
        pace: '4:30/km',
      },
    ],
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
