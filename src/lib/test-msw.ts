import { http, HttpResponse } from 'msw'

// Helper to safely parse request body
async function parseRequestBody(
  request: Request
): Promise<Record<string, unknown>> {
  try {
    const body = await request.json()
    return typeof body === 'object' && body !== null
      ? (body as Record<string, unknown>)
      : {}
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
    slug: 'morning-runners',
    description: 'Early morning running group',
    website: 'https://morningrunners.com',
    instagram: null,
    facebook: null,
    language: null,
    stravaClubId: null,
    stravaSlug: null,
    isManual: true,
    lastSynced: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ownerId: 'user-1',
    events: [],
  },
  {
    id: 'club-2',
    name: 'Evening Runners',
    slug: 'evening-runners',
    description: 'Evening running group',
    website: null,
    instagram: '@eveningrunners',
    facebook: null,
    language: null,
    stravaClubId: null,
    stravaSlug: null,
    isManual: true,
    lastSynced: null,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    ownerId: 'user-2',
    events: [],
  },
]

export const mockEvents = [
  {
    id: 'event-1',
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
    id: 'event-2',
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

export const mockUsers = [
  {
    id: 'user-1',
    email: 'admin@example.com',
    name: 'Admin User',
    isAdmin: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 'user-2',
    email: 'user@example.com',
    name: 'Regular User',
    isAdmin: false,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
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
    const club = createMockResponse(
      { id: 'club-new', ownerId: 'user-1', slug: 'test-club' },
      newClub
    )
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

  // Events API
  http.get('/api/events', () => {
    return HttpResponse.json(mockEvents)
  }),

  http.post('/api/events', async ({ request }) => {
    const newEvent = await parseRequestBody(request)
    const event = createMockResponse(
      {
        id: 'event-new',
        club: {
          id: (newEvent.clubId as string) || 'default-club',
          name: 'Test Club',
        },
      },
      newEvent
    )
    return HttpResponse.json(event, { status: 201 })
  }),

  http.put('/api/events/:id', async ({ params, request }) => {
    const updates = await parseRequestBody(request)
    const event = mockEvents.find((e) => e.id === params.id)
    if (!event) {
      return HttpResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    const updatedEvent = createMockResponse(event, updates)
    return HttpResponse.json(updatedEvent)
  }),

  http.delete('/api/events/:id', ({ params }) => {
    const event = mockEvents.find((e) => e.id === params.id)
    if (!event) {
      return HttpResponse.json({ error: 'Event not found' }, { status: 404 })
    }
    return HttpResponse.json({ success: true })
  }),

  // Admin Users API
  http.get('/api/admin/users', () => {
    return HttpResponse.json(mockUsers)
  }),

  http.patch('/api/admin/users/:id', async ({ params, request }) => {
    const updates = await parseRequestBody(request)
    const user = mockUsers.find((u) => u.id === params.id)
    if (!user) {
      return HttpResponse.json({ error: 'User not found' }, { status: 404 })
    }
    // Add small delay to simulate network request
    await new Promise((resolve) => setTimeout(resolve, 100))
    const updatedUser = createMockResponse(user, updates)
    return HttpResponse.json(updatedUser)
  }),
]

// Create MSW server
export const server = setupServer(...handlers)
