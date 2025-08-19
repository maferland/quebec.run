import { http, HttpResponse } from 'msw'

// Helper to safely parse request body
async function parseRequestBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json()
    return typeof body === 'object' && body !== null ? body as Record<string, unknown> : {}
  } catch {
    return {}
  }
}

// Helper to create mock responses with consistent structure
function createMockResponse<T extends Record<string, unknown>>(
  baseData: T, 
  overrides: Record<string, unknown> = {}
) {
  return {
    ...baseData,
    ...overrides,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}
import { setupServer } from 'msw/node'

// Mock data
export const mockClubs = [
  {
    id: 'club-1',
    name: 'Morning Runners',
    description: 'Early morning running group',
    address: '123 Main St, Quebec City',
    website: 'https://morningrunners.com',
    instagram: null,
    facebook: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: 'user-1',
    upcomingRuns: [],
  },
  {
    id: 'club-2',
    name: 'Evening Runners',
    description: 'Evening running group',
    address: '456 Oak St, Quebec City',
    website: null,
    instagram: '@eveningrunners',
    facebook: null,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    createdBy: 'user-2',
    upcomingRuns: [],
  },
]

export const mockRuns = [
  {
    id: 'run-1',
    title: 'Morning 5K',
    description: 'Easy 5K run',
    date: new Date('2025-01-01'),
    time: '07:00',
    address: '123 Main St, Quebec City',
    distance: '5km',
    pace: '5:30/km',
    createdAt: new Date('2024-12-01'),
    updatedAt: new Date('2024-12-01'),
    clubId: 'club-1',
    club: {
      id: 'club-1',
      name: 'Morning Runners',
    },
  },
  {
    id: 'run-2',
    title: 'Evening 10K',
    description: 'Tempo 10K run',
    date: new Date('2025-01-02'),
    time: '18:00',
    address: '456 Oak St, Quebec City',
    distance: '10km',
    pace: '4:45/km',
    createdAt: new Date('2024-12-02'),
    updatedAt: new Date('2024-12-02'),
    clubId: 'club-2',
    club: {
      id: 'club-2',
      name: 'Evening Runners',
    },
  },
]

// MSW handlers
export const handlers = [
  // Clubs API
  http.get('/api/clubs', () => {
    return HttpResponse.json(mockClubs)
  }),

  http.post('/api/clubs', async ({ request }) => {
    const newClub = await parseRequestBody(request)
    const club = createMockResponse({ id: 'club-new', createdBy: 'user-1' }, newClub)
    return HttpResponse.json(club, { status: 201 })
  }),

  http.get('/api/clubs/:id', ({ params }) => {
    const club = mockClubs.find((c) => c.id === params.id)
    if (!club) {
      return HttpResponse.json({ error: 'Club not found' }, { status: 404 })
    }
    return HttpResponse.json(club)
  }),

  http.put('/api/clubs/:id', async ({ params, request }) => {
    const updates = await parseRequestBody(request)
    const club = mockClubs.find((c) => c.id === params.id)
    if (!club) {
      return HttpResponse.json({ error: 'Club not found' }, { status: 404 })
    }
    const updatedClub = createMockResponse(club, updates)
    return HttpResponse.json(updatedClub)
  }),

  http.delete('/api/clubs/:id', ({ params }) => {
    const club = mockClubs.find((c) => c.id === params.id)
    if (!club) {
      return HttpResponse.json({ error: 'Club not found' }, { status: 404 })
    }
    return HttpResponse.json({ success: true })
  }),

  // Runs API
  http.get('/api/runs', () => {
    return HttpResponse.json(mockRuns)
  }),

  http.post('/api/runs', async ({ request }) => {
    const newRun = await parseRequestBody(request)
    const run = createMockResponse(
      { 
        id: 'run-new',
        club: {
          id: newRun.clubId as string || 'default-club',
          name: 'Test Club',
        },
      }, 
      newRun
    )
    return HttpResponse.json(run, { status: 201 })
  }),
]

// Create MSW server
export const server = setupServer(...handlers)