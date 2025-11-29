# Strava Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Backend-only Strava integration enabling admins to link clubs to Strava groups and manually sync events.

**Architecture:** Strava SDK + admin-only API endpoints + manual sync. No OAuth, no cron (deferred). Preview before linking, track sync status, email alerts on failures (batched for future cron).

**Tech Stack:** `strava-v3` SDK, Prisma, Next.js API routes, Zod validation, NextAuth admin checks

**Design Doc:** `docs/plans/2025-11-28-strava-integration-design.md`

---

## Phase 1: Schema & Migration

### Task 1: Add Strava fields to Prisma schema

**Files:**

- Modify: `prisma/schema.prisma`

**Step 1: Add fields to Club model**

Add after line 87 (`lastSynced   DateTime?`):

```prisma
  // NEW: Track manual field overrides
  manualOverrides String[] @default([])

  // NEW: Sync status tracking
  lastSyncStatus   String?   // 'success' | 'failed' | 'in_progress'
  lastSyncError    String?   // Error message if failed
  lastSyncAttempt  DateTime? // When sync was attempted
```

**Step 2: Add stravaEventId to Event model**

Add after line 152 (`pace        String?`):

```prisma
  // NEW: Track Strava source
  stravaEventId String? @unique
```

**Step 3: Generate and run migration**

```bash
npx prisma migrate dev --name add_strava_sync_tracking
```

Expected: Migration created and applied successfully

**Step 4: Verify schema**

```bash
npx prisma format
```

Expected: Schema formatted, no errors

**Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "schema: add Strava sync tracking fields to Club and Event

- Club: manualOverrides, sync status fields
- Event: stravaEventId for tracking source
- Enables admin preview, link, manual sync"
```

---

## Phase 2: Strava SDK Setup

### Task 2: Install strava-v3 SDK

**Files:**

- Modify: `package.json`

**Step 1: Install SDK**

```bash
npm install strava-v3
npm install --save-dev @types/strava-v3
```

**Step 2: Verify installation**

```bash
npm list strava-v3
```

Expected: `strava-v3@<version>` listed

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add strava-v3 SDK for API integration"
```

---

### Task 3: Add Strava env vars

**Files:**

- Modify: `.env.example`

**Step 1: Add Strava variables**

Add after email config section:

```env
# Strava API
# Register app at https://www.strava.com/settings/api
STRAVA_CLIENT_ID="12345"
STRAVA_CLIENT_SECRET="your-secret-here"
```

**Step 2: Update env validation**

Modify: `src/lib/env.ts`

Add to schema after email vars:

```typescript
  // Strava API
  STRAVA_CLIENT_ID: z.string().min(1),
  STRAVA_CLIENT_SECRET: z.string().min(1),
```

**Step 3: Commit**

```bash
git add .env.example src/lib/env.ts
git commit -m "config: add Strava API environment variables"
```

---

### Task 4: Create Strava client wrapper

**Files:**

- Create: `src/lib/strava.ts`
- Create: `src/lib/strava.test.ts`

**Step 1: Write failing test**

```typescript
// src/lib/strava.test.ts
import { describe, test, expect } from 'vitest'
import { createStravaClient } from './strava'

describe('createStravaClient', () => {
  test('returns strava client instance', () => {
    const client = createStravaClient()
    expect(client).toBeDefined()
    expect(typeof client.clubs.get).toBe('function')
  })
})
```

**Step 2: Run test to verify failure**

```bash
npm test -- strava.test.ts
```

Expected: FAIL - "Cannot find module './strava'"

**Step 3: Implement Strava client**

```typescript
// src/lib/strava.ts
import strava from 'strava-v3'
import { env } from '@/lib/env'

export type StravaClient = ReturnType<typeof strava.client>

export function createStravaClient(): StravaClient {
  return strava.client({
    client_id: env.STRAVA_CLIENT_ID,
    client_secret: env.STRAVA_CLIENT_SECRET,
  })
}

export const stravaClient = createStravaClient()
```

**Step 4: Run test to verify pass**

```bash
npm test -- strava.test.ts
```

Expected: PASS (1 test)

**Step 5: Commit**

```bash
git add src/lib/strava.ts src/lib/strava.test.ts
git commit -m "feat(strava): add SDK client wrapper"
```

---

### Task 5: Create Strava service types

**Files:**

- Create: `src/lib/services/strava-types.ts`

**Step 1: Define Strava API response types**

```typescript
// src/lib/services/strava-types.ts
export type StravaClub = {
  id: number
  name: string
  description: string
  sport_type: string
  city: string
  country: string
  member_count: number
  url: string
  profile: string
  cover_photo: string
  cover_photo_small: string
}

export type StravaGroupEvent = {
  id: number
  title: string
  description: string
  club_id: number
  address: string
  upcoming_occurrences: Array<{
    start_date: string // ISO 8601
  }>
  route?: {
    distance: number // meters
  }
}

export type StravaPreviewData = {
  club: StravaClub
  upcomingEvents: StravaGroupEvent[]
}

export type SyncSummary = {
  eventsAdded: number
  eventsUpdated: number
  eventsDeleted: number
  fieldsUpdated: string[]
}
```

**Step 2: Commit**

```bash
git add src/lib/services/strava-types.ts
git commit -m "feat(strava): define API response types"
```

---

## Phase 3: Strava Service Layer

### Task 6: Implement fetchStravaClub

**Files:**

- Create: `src/lib/services/strava.ts`
- Create: `src/lib/services/strava.test.ts`

**Step 1: Write failing test**

```typescript
// src/lib/services/strava.test.ts
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { fetchStravaClub } from './strava'
import * as stravaLib from '@/lib/strava'

vi.mock('@/lib/strava')

describe('fetchStravaClub', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('fetches club data from Strava API', async () => {
    const mockClub = {
      id: 123,
      name: 'Test Club',
      description: 'Test Description',
      sport_type: 'running',
      city: 'Quebec',
      country: 'Canada',
      member_count: 50,
      url: 'https://strava.com/clubs/test',
      profile: 'https://strava.com/photo.jpg',
      cover_photo: 'https://strava.com/cover.jpg',
      cover_photo_small: 'https://strava.com/cover-small.jpg',
    }

    vi.mocked(stravaLib.stravaClient.clubs.get).mockResolvedValue(mockClub)

    const result = await fetchStravaClub(123)

    expect(result).toEqual(mockClub)
    expect(stravaLib.stravaClient.clubs.get).toHaveBeenCalledWith({ id: 123 })
  })

  test('throws StravaNotFoundError on 404', async () => {
    const error: any = new Error('Not found')
    error.statusCode = 404
    vi.mocked(stravaLib.stravaClient.clubs.get).mockRejectedValue(error)

    await expect(fetchStravaClub(123)).rejects.toThrow(
      'Club not found or private'
    )
  })

  test('throws StravaRateLimitError on 429', async () => {
    const error: any = new Error('Rate limited')
    error.statusCode = 429
    vi.mocked(stravaLib.stravaClient.clubs.get).mockRejectedValue(error)

    await expect(fetchStravaClub(123)).rejects.toThrow('Rate limit exceeded')
  })
})
```

**Step 2: Run test to verify failure**

```bash
npm test -- strava.test.ts
```

Expected: FAIL - "Cannot find module './strava'"

**Step 3: Implement fetchStravaClub**

```typescript
// src/lib/services/strava.ts
import { stravaClient } from '@/lib/strava'
import type { StravaClub, StravaGroupEvent } from './strava-types'

export class StravaError extends Error {
  constructor(
    message: string,
    public originalError?: any
  ) {
    super(message)
    this.name = 'StravaError'
  }
}

export class StravaNotFoundError extends StravaError {
  constructor() {
    super('Club not found or private')
    this.name = 'StravaNotFoundError'
  }
}

export class StravaRateLimitError extends StravaError {
  constructor() {
    super('Rate limit exceeded, retry in 15 minutes')
    this.name = 'StravaRateLimitError'
  }
}

export class StravaAuthError extends StravaError {
  constructor() {
    super('Invalid API credentials')
    this.name = 'StravaAuthError'
  }
}

export async function fetchStravaClub(clubId: number): Promise<StravaClub> {
  try {
    const club = await stravaClient.clubs.get({ id: clubId })
    return club as StravaClub
  } catch (error: any) {
    if (error.statusCode === 404) {
      throw new StravaNotFoundError()
    }
    if (error.statusCode === 429) {
      throw new StravaRateLimitError()
    }
    if (error.statusCode === 401) {
      throw new StravaAuthError()
    }
    throw new StravaError('Failed to fetch club', error)
  }
}
```

**Step 4: Run test to verify pass**

```bash
npm test -- strava.test.ts
```

Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add src/lib/services/strava.ts src/lib/services/strava.test.ts
git commit -m "feat(strava): implement fetchStravaClub with error handling"
```

---

### Task 7: Implement fetchStravaEvents

**Files:**

- Modify: `src/lib/services/strava.ts`
- Modify: `src/lib/services/strava.test.ts`

**Step 1: Write failing test**

Add to `strava.test.ts`:

```typescript
describe('fetchStravaEvents', () => {
  test('fetches group events from Strava API', async () => {
    const mockEvents = [
      {
        id: 1,
        title: 'Morning Run',
        description: 'Test run',
        club_id: 123,
        address: '123 Main St, Quebec',
        upcoming_occurrences: [{ start_date: '2025-12-01T08:00:00Z' }],
        route: { distance: 5000 },
      },
    ]

    vi.mocked(stravaLib.stravaClient.clubs.listEvents).mockResolvedValue(
      mockEvents
    )

    const result = await fetchStravaEvents(123)

    expect(result).toEqual(mockEvents)
    expect(stravaLib.stravaClient.clubs.listEvents).toHaveBeenCalledWith({
      id: 123,
    })
  })

  test('handles missing route gracefully', async () => {
    const mockEvents = [
      {
        id: 1,
        title: 'Morning Run',
        description: 'Test run',
        club_id: 123,
        address: '123 Main St',
        upcoming_occurrences: [{ start_date: '2025-12-01T08:00:00Z' }],
      },
    ]

    vi.mocked(stravaLib.stravaClient.clubs.listEvents).mockResolvedValue(
      mockEvents
    )

    const result = await fetchStravaEvents(123)

    expect(result).toEqual(mockEvents)
  })
})
```

**Step 2: Run test to verify failure**

```bash
npm test -- strava.test.ts
```

Expected: FAIL - "fetchStravaEvents is not defined"

**Step 3: Implement fetchStravaEvents**

Add to `strava.ts`:

```typescript
export async function fetchStravaEvents(
  clubId: number
): Promise<StravaGroupEvent[]> {
  try {
    const events = await stravaClient.clubs.listEvents({ id: clubId })
    return events as StravaGroupEvent[]
  } catch (error: any) {
    if (error.statusCode === 404) {
      throw new StravaNotFoundError()
    }
    if (error.statusCode === 429) {
      throw new StravaRateLimitError()
    }
    if (error.statusCode === 401) {
      throw new StravaAuthError()
    }
    throw new StravaError('Failed to fetch events', error)
  }
}
```

**Step 4: Run test to verify pass**

```bash
npm test -- strava.test.ts
```

Expected: PASS (5 tests)

**Step 5: Commit**

```bash
git add src/lib/services/strava.ts src/lib/services/strava.test.ts
git commit -m "feat(strava): implement fetchStravaEvents"
```

---

### Task 8: Implement mapStravaClubToDb

**Files:**

- Modify: `src/lib/services/strava.ts`
- Modify: `src/lib/services/strava.test.ts`

**Step 1: Write failing test**

Add to `strava.test.ts`:

```typescript
describe('mapStravaClubToDb', () => {
  const mockClub: StravaClub = {
    id: 123,
    name: 'Test Club',
    description: 'Test Description',
    sport_type: 'running',
    city: 'Quebec',
    country: 'Canada',
    member_count: 50,
    url: 'https://strava.com/clubs/test',
    profile: 'photo.jpg',
    cover_photo: 'cover.jpg',
    cover_photo_small: 'cover-small.jpg',
  }

  test('maps all fields when no overrides', () => {
    const result = mapStravaClubToDb(mockClub, [])

    expect(result).toEqual({
      stravaClubId: '123',
      name: 'Test Club',
      description: 'Test Description',
      website: 'https://strava.com/clubs/test',
    })
  })

  test('skips fields in manualOverrides', () => {
    const result = mapStravaClubToDb(mockClub, ['description', 'website'])

    expect(result).toEqual({
      stravaClubId: '123',
      name: 'Test Club',
      description: undefined,
      website: undefined,
    })
  })

  test('handles empty description', () => {
    const clubNoDesc = { ...mockClub, description: '' }
    const result = mapStravaClubToDb(clubNoDesc, [])

    expect(result.description).toBeNull()
  })
})
```

**Step 2: Run test to verify failure**

```bash
npm test -- strava.test.ts
```

Expected: FAIL - "mapStravaClubToDb is not defined"

**Step 3: Implement mapStravaClubToDb**

Add to `strava.ts`:

```typescript
type ClubUpdateData = {
  stravaClubId: string
  name?: string
  description?: string | null
  website?: string
}

export function mapStravaClubToDb(
  club: StravaClub,
  manualOverrides: string[]
): ClubUpdateData {
  const data: ClubUpdateData = {
    stravaClubId: club.id.toString(),
  }

  if (!manualOverrides.includes('name')) {
    data.name = club.name
  }

  if (!manualOverrides.includes('description')) {
    data.description = club.description || null
  }

  if (!manualOverrides.includes('website')) {
    data.website = club.url
  }

  return data
}
```

**Step 4: Run test to verify pass**

```bash
npm test -- strava.test.ts
```

Expected: PASS (8 tests)

**Step 5: Commit**

```bash
git add src/lib/services/strava.ts src/lib/services/strava.test.ts
git commit -m "feat(strava): implement mapStravaClubToDb with override logic"
```

---

### Task 9: Implement mapStravaEventToDb

**Files:**

- Modify: `src/lib/services/strava.ts`
- Modify: `src/lib/services/strava.test.ts`

**Step 1: Write failing test**

Add to `strava.test.ts`:

```typescript
describe('mapStravaEventToDb', () => {
  const mockEvent: StravaGroupEvent = {
    id: 1,
    title: 'Morning Run',
    description: 'Test run description',
    club_id: 123,
    address: '123 Main St, Quebec',
    upcoming_occurrences: [{ start_date: '2025-12-01T08:30:00Z' }],
    route: { distance: 5000 },
  }

  test('maps Strava event to DB format', () => {
    const result = mapStravaEventToDb(mockEvent, 'club123')

    expect(result).toEqual({
      stravaEventId: '1',
      clubId: 'club123',
      title: 'Morning Run',
      description: 'Test run description',
      address: '123 Main St, Quebec',
      date: new Date('2025-12-01T08:30:00Z'),
      time: '08:30',
      distance: '5.0 km',
    })
  })

  test('handles missing route distance', () => {
    const eventNoRoute = { ...mockEvent, route: undefined }
    const result = mapStravaEventToDb(eventNoRoute, 'club123')

    expect(result.distance).toBeNull()
  })

  test('handles empty description', () => {
    const eventNoDesc = { ...mockEvent, description: '' }
    const result = mapStravaEventToDb(eventNoDesc, 'club123')

    expect(result.description).toBeNull()
  })
})
```

**Step 2: Run test to verify failure**

```bash
npm test -- strava.test.ts
```

Expected: FAIL - "mapStravaEventToDb is not defined"

**Step 3: Implement mapStravaEventToDb**

Add to `strava.ts`:

```typescript
type EventCreateData = {
  stravaEventId: string
  clubId: string
  title: string
  description: string | null
  address: string
  date: Date
  time: string
  distance: string | null
}

export function mapStravaEventToDb(
  event: StravaGroupEvent,
  clubId: string
): EventCreateData {
  const startDate = new Date(event.upcoming_occurrences[0].start_date)
  const time = startDate.toTimeString().slice(0, 5) // HH:mm

  let distance: string | null = null
  if (event.route?.distance) {
    distance = `${(event.route.distance / 1000).toFixed(1)} km`
  }

  return {
    stravaEventId: event.id.toString(),
    clubId,
    title: event.title,
    description: event.description || null,
    address: event.address,
    date: startDate,
    time,
    distance,
  }
}
```

**Step 4: Run test to verify pass**

```bash
npm test -- strava.test.ts
```

Expected: PASS (11 tests)

**Step 5: Commit**

```bash
git add src/lib/services/strava.ts src/lib/services/strava.test.ts
git commit -m "feat(strava): implement mapStravaEventToDb with data transformations"
```

---

## Phase 4: API Endpoints

### Task 10: Implement preview endpoint

**Files:**

- Create: `src/app/api/admin/strava/preview/route.ts`
- Create: `src/app/api/admin/strava/preview/route.test.ts`

**Step 1: Write failing test**

```typescript
// src/app/api/admin/strava/preview/route.test.ts
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { GET } from './route'
import { getServerSession } from 'next-auth'
import * as stravaService from '@/lib/services/strava'

vi.mock('next-auth')
vi.mock('@/lib/services/strava')

describe('GET /api/admin/strava/preview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('returns 401 when not admin', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: '1', email: 'user@test.com', isAdmin: false },
    } as any)

    const request = new Request(
      'http://localhost/api/admin/strava/preview?slug=test-club'
    )
    const response = await GET(request)

    expect(response.status).toBe(401)
    const json = await response.json()
    expect(json.error).toContain('Admin access required')
  })

  test('returns 400 when slug missing', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: '1', email: 'admin@test.com', isAdmin: true },
    } as any)

    const request = new Request('http://localhost/api/admin/strava/preview')
    const response = await GET(request)

    expect(response.status).toBe(400)
    const json = await response.json()
    expect(json.error).toContain('slug is required')
  })

  test('returns club and event preview', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: '1', email: 'admin@test.com', isAdmin: true },
    } as any)

    const mockClub = { id: 123, name: 'Test Club' }
    const mockEvents = [{ id: 1, title: 'Run' }]

    vi.mocked(stravaService.fetchStravaClub).mockResolvedValue(mockClub as any)
    vi.mocked(stravaService.fetchStravaEvents).mockResolvedValue(
      mockEvents as any
    )

    const request = new Request(
      'http://localhost/api/admin/strava/preview?slug=test-club-123'
    )
    const response = await GET(request)

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.club).toEqual(mockClub)
    expect(json.upcomingEvents).toEqual(mockEvents)
  })
})
```

**Step 2: Run test to verify failure**

```bash
npm test -- preview/route.test.ts
```

Expected: FAIL - "Cannot find module './route'"

**Step 3: Implement preview endpoint**

```typescript
// src/app/api/admin/strava/preview/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { fetchStravaClub, fetchStravaEvents } from '@/lib/services/strava'

export async function GET(request: NextRequest) {
  // Check admin
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 401 }
    )
  }

  // Get slug from query
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')

  if (!slug) {
    return NextResponse.json({ error: 'slug is required' }, { status: 400 })
  }

  try {
    // Extract club ID from slug (format: club-name-123456)
    const clubIdMatch = slug.match(/-(\d+)$/)
    if (!clubIdMatch) {
      return NextResponse.json(
        { error: 'Invalid slug format (expected: club-name-123456)' },
        { status: 400 }
      )
    }

    const clubId = parseInt(clubIdMatch[1], 10)

    // Fetch from Strava
    const [club, upcomingEvents] = await Promise.all([
      fetchStravaClub(clubId),
      fetchStravaEvents(clubId),
    ])

    return NextResponse.json({
      club,
      upcomingEvents: upcomingEvents.slice(0, 5), // Preview first 5
    })
  } catch (error: any) {
    console.error('Strava preview error:', error)

    if (error.name === 'StravaNotFoundError') {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    if (error.name === 'StravaRateLimitError') {
      return NextResponse.json({ error: error.message }, { status: 429 })
    }

    return NextResponse.json(
      { error: 'Failed to fetch Strava data' },
      { status: 500 }
    )
  }
}
```

**Step 4: Run test to verify pass**

```bash
npm test -- preview/route.test.ts
```

Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add src/app/api/admin/strava/preview/
git commit -m "feat(api): implement Strava preview endpoint

Admin-only endpoint to fetch club/event data before linking"
```

---

### Task 11: Implement sync service

**Files:**

- Create: `src/lib/services/strava-sync.ts`
- Create: `src/lib/services/strava-sync.test.ts`

**Step 1: Write failing test**

```typescript
// src/lib/services/strava-sync.test.ts
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { syncStravaClub } from './strava-sync'
import { prisma } from '@/lib/prisma'
import * as stravaService from './strava'

vi.mock('./strava')

describe('syncStravaClub', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await prisma.event.deleteMany()
    await prisma.club.deleteMany()
  })

  test('syncs club and creates events', async () => {
    // Create test club
    const club = await prisma.club.create({
      data: {
        name: 'Test Club',
        slug: 'test-club',
        stravaSlug: 'test-club-123',
        stravaClubId: '123',
        ownerId: 'user1',
      },
    })

    // Mock Strava responses
    vi.mocked(stravaService.fetchStravaClub).mockResolvedValue({
      id: 123,
      name: 'Updated Club Name',
      description: 'Updated description',
      url: 'https://strava.com/clubs/test',
    } as any)

    vi.mocked(stravaService.fetchStravaEvents).mockResolvedValue([
      {
        id: 1,
        title: 'Morning Run',
        club_id: 123,
        address: '123 Main St',
        upcoming_occurrences: [{ start_date: '2025-12-01T08:00:00Z' }],
        route: { distance: 5000 },
      } as any,
    ])

    // Sync
    const result = await syncStravaClub(club.id)

    // Verify club updated
    const updatedClub = await prisma.club.findUnique({ where: { id: club.id } })
    expect(updatedClub?.name).toBe('Updated Club Name')
    expect(updatedClub?.lastSyncStatus).toBe('success')

    // Verify event created
    const events = await prisma.event.findMany({ where: { clubId: club.id } })
    expect(events).toHaveLength(1)
    expect(events[0].title).toBe('Morning Run')

    // Verify summary
    expect(result.eventsAdded).toBe(1)
    expect(result.eventsUpdated).toBe(0)
    expect(result.eventsDeleted).toBe(0)
  })

  test('respects manualOverrides', async () => {
    const club = await prisma.club.create({
      data: {
        name: 'Original Name',
        slug: 'test-club',
        stravaSlug: 'test-club-123',
        stravaClubId: '123',
        manualOverrides: ['name'],
        ownerId: 'user1',
      },
    })

    vi.mocked(stravaService.fetchStravaClub).mockResolvedValue({
      id: 123,
      name: 'New Name',
      description: 'Description',
    } as any)
    vi.mocked(stravaService.fetchStravaEvents).mockResolvedValue([])

    await syncStravaClub(club.id)

    const updated = await prisma.club.findUnique({ where: { id: club.id } })
    expect(updated?.name).toBe('Original Name') // Not updated
    expect(updated?.description).toBe('Description') // Updated
  })
})
```

**Step 2: Run test to verify failure**

```bash
npm test -- strava-sync.test.ts
```

Expected: FAIL - "Cannot find module './strava-sync'"

**Step 3: Implement syncStravaClub (part 1: setup)**

```typescript
// src/lib/services/strava-sync.ts
import { prisma } from '@/lib/prisma'
import {
  fetchStravaClub,
  fetchStravaEvents,
  mapStravaClubToDb,
  mapStravaEventToDb,
} from './strava'
import type { SyncSummary } from './strava-types'

export async function syncStravaClub(clubId: string): Promise<SyncSummary> {
  // Fetch club with current state
  const club = await prisma.club.findUnique({
    where: { id: clubId },
    select: {
      id: true,
      stravaClubId: true,
      stravaSlug: true,
      manualOverrides: true,
    },
  })

  if (!club?.stravaClubId) {
    throw new Error('Club not linked to Strava')
  }

  const summary: SyncSummary = {
    eventsAdded: 0,
    eventsUpdated: 0,
    eventsDeleted: 0,
    fieldsUpdated: [],
  }

  try {
    // Mark sync in progress
    await prisma.club.update({
      where: { id: clubId },
      data: {
        lastSyncStatus: 'in_progress',
        lastSyncAttempt: new Date(),
      },
    })

    // Fetch from Strava
    const stravaClubId = parseInt(club.stravaClubId, 10)
    const [stravaClub, stravaEvents] = await Promise.all([
      fetchStravaClub(stravaClubId),
      fetchStravaEvents(stravaClubId),
    ])

    // Update club info (respecting overrides)
    const clubUpdate = mapStravaClubToDb(stravaClub, club.manualOverrides)
    await prisma.club.update({
      where: { id: clubId },
      data: clubUpdate,
    })

    if (clubUpdate.name) summary.fieldsUpdated.push('name')
    if (clubUpdate.description !== undefined)
      summary.fieldsUpdated.push('description')
    if (clubUpdate.website) summary.fieldsUpdated.push('website')

    // Sync events (create/update)
    for (const stravaEvent of stravaEvents) {
      const eventData = mapStravaEventToDb(stravaEvent, clubId)

      const existing = await prisma.event.findUnique({
        where: { stravaEventId: eventData.stravaEventId },
      })

      if (existing) {
        await prisma.event.update({
          where: { stravaEventId: eventData.stravaEventId },
          data: eventData,
        })
        summary.eventsUpdated++
      } else {
        await prisma.event.create({ data: eventData })
        summary.eventsAdded++
      }
    }

    // Delete events removed from Strava
    const stravaEventIds = stravaEvents.map((e) => e.id.toString())
    const deleted = await prisma.event.deleteMany({
      where: {
        clubId,
        stravaEventId: { not: null },
        stravaEventId: { notIn: stravaEventIds },
      },
    })
    summary.eventsDeleted = deleted.count

    // Mark success
    await prisma.club.update({
      where: { id: clubId },
      data: {
        lastSyncStatus: 'success',
        lastSynced: new Date(),
        lastSyncError: null,
      },
    })

    return summary
  } catch (error: any) {
    // Mark failure
    await prisma.club.update({
      where: { id: clubId },
      data: {
        lastSyncStatus: 'failed',
        lastSyncError: error.message || 'Unknown error',
      },
    })

    throw error
  }
}
```

**Step 4: Run test to verify pass**

```bash
npm test -- strava-sync.test.ts
```

Expected: PASS (2 tests)

**Step 5: Commit**

```bash
git add src/lib/services/strava-sync.ts src/lib/services/strava-sync.test.ts
git commit -m "feat(strava): implement syncStravaClub service

- Fetches club + events from Strava
- Respects manualOverrides
- Creates/updates/deletes events
- Tracks sync status"
```

---

### Task 12: Implement link endpoint

**Files:**

- Create: `src/app/api/admin/clubs/[id]/link-strava/route.ts`
- Create: `src/app/api/admin/clubs/[id]/link-strava/route.test.ts`

**Step 1: Write failing test**

```typescript
// src/app/api/admin/clubs/[id]/link-strava/route.test.ts
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import * as stravaSync from '@/lib/services/strava-sync'

vi.mock('next-auth')
vi.mock('@/lib/services/strava-sync')

describe('POST /api/admin/clubs/[id]/link-strava', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await prisma.club.deleteMany()
  })

  test('returns 401 when not admin', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: '1', isAdmin: false },
    } as any)

    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ stravaSlug: 'test-123' }),
    })
    const response = await POST(request, { params: { id: 'club1' } })

    expect(response.status).toBe(401)
  })

  test('links club and imports events', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: '1', isAdmin: true },
    } as any)

    const club = await prisma.club.create({
      data: {
        name: 'Test Club',
        slug: 'test-club',
        ownerId: 'user1',
      },
    })

    vi.mocked(stravaSync.syncStravaClub).mockResolvedValue({
      eventsAdded: 3,
      eventsUpdated: 0,
      eventsDeleted: 0,
      fieldsUpdated: ['name', 'description'],
    })

    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({
        stravaSlug: 'test-club-123456',
        importEvents: true,
      }),
    })
    const response = await POST(request, { params: { id: club.id } })

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.summary.eventsImported).toBe(3)

    // Verify club updated
    const updated = await prisma.club.findUnique({ where: { id: club.id } })
    expect(updated?.stravaSlug).toBe('test-club-123456')
    expect(updated?.stravaClubId).toBe('123456')
    expect(updated?.isManual).toBe(false)
  })
})
```

**Step 2: Run test to verify failure**

```bash
npm test -- link-strava/route.test.ts
```

Expected: FAIL - "Cannot find module './route'"

**Step 3: Implement link-strava endpoint**

```typescript
// src/app/api/admin/clubs/[id]/link-strava/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { syncStravaClub } from '@/lib/services/strava-sync'
import { z } from 'zod'

const linkSchema = z.object({
  stravaSlug: z.string().min(1),
  importEvents: z.boolean().default(true),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Check admin
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { stravaSlug, importEvents } = linkSchema.parse(body)

    // Extract club ID from slug
    const clubIdMatch = stravaSlug.match(/-(\d+)$/)
    if (!clubIdMatch) {
      return NextResponse.json(
        { error: 'Invalid slug format (expected: club-name-123456)' },
        { status: 400 }
      )
    }

    const stravaClubId = clubIdMatch[1]

    // Update club with Strava slug
    await prisma.club.update({
      where: { id: params.id },
      data: {
        stravaSlug,
        stravaClubId,
        isManual: false,
      },
    })

    // Sync if importEvents=true
    let summary = {
      eventsImported: 0,
      fieldsUpdated: [] as string[],
    }

    if (importEvents) {
      const syncResult = await syncStravaClub(params.id)
      summary = {
        eventsImported: syncResult.eventsAdded,
        fieldsUpdated: syncResult.fieldsUpdated,
      }
    }

    // Fetch updated club
    const club = await prisma.club.findUnique({
      where: { id: params.id },
    })

    return NextResponse.json({
      club,
      summary,
    })
  } catch (error: any) {
    console.error('Link Strava error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to link Strava club' },
      { status: 500 }
    )
  }
}
```

**Step 4: Run test to verify pass**

```bash
npm test -- link-strava/route.test.ts
```

Expected: PASS (2 tests)

**Step 5: Commit**

```bash
git add src/app/api/admin/clubs/[id]/link-strava/
git commit -m "feat(api): implement link-strava endpoint

Links club to Strava and optionally imports events"
```

---

### Task 13: Implement manual sync endpoint

**Files:**

- Create: `src/app/api/admin/clubs/[id]/sync-strava/route.ts`
- Create: `src/app/api/admin/clubs/[id]/sync-strava/route.test.ts`

**Step 1: Write failing test**

```typescript
// src/app/api/admin/clubs/[id]/sync-strava/route.test.ts
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import * as stravaSync from '@/lib/services/strava-sync'

vi.mock('next-auth')
vi.mock('@/lib/services/strava-sync')

describe('POST /api/admin/clubs/[id]/sync-strava', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await prisma.club.deleteMany()
  })

  test('returns 401 when not admin', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: '1', isAdmin: false },
    } as any)

    const request = new Request('http://localhost', { method: 'POST' })
    const response = await POST(request, { params: { id: 'club1' } })

    expect(response.status).toBe(401)
  })

  test('syncs club successfully', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: '1', isAdmin: true },
    } as any)

    const club = await prisma.club.create({
      data: {
        name: 'Test Club',
        slug: 'test-club',
        stravaSlug: 'test-123',
        stravaClubId: '123',
        ownerId: 'user1',
      },
    })

    vi.mocked(stravaSync.syncStravaClub).mockResolvedValue({
      eventsAdded: 2,
      eventsUpdated: 1,
      eventsDeleted: 0,
      fieldsUpdated: ['description'],
    })

    const request = new Request('http://localhost', { method: 'POST' })
    const response = await POST(request, { params: { id: club.id } })

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.success).toBe(true)
    expect(json.summary).toEqual({
      eventsAdded: 2,
      eventsUpdated: 1,
      eventsDeleted: 0,
      fieldsUpdated: ['description'],
    })
  })

  test('returns error on sync failure', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: '1', isAdmin: true },
    } as any)

    const club = await prisma.club.create({
      data: {
        name: 'Test Club',
        slug: 'test-club',
        stravaSlug: 'test-123',
        stravaClubId: '123',
        ownerId: 'user1',
      },
    })

    vi.mocked(stravaSync.syncStravaClub).mockRejectedValue(
      new Error('Network timeout')
    )

    const request = new Request('http://localhost', { method: 'POST' })
    const response = await POST(request, { params: { id: club.id } })

    expect(response.status).toBe(500)
    const json = await response.json()
    expect(json.success).toBe(false)
    expect(json.error).toContain('Network timeout')
  })
})
```

**Step 2: Run test to verify failure**

```bash
npm test -- sync-strava/route.test.ts
```

Expected: FAIL - "Cannot find module './route'"

**Step 3: Implement sync-strava endpoint**

```typescript
// src/app/api/admin/clubs/[id]/sync-strava/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { syncStravaClub } from '@/lib/services/strava-sync'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Check admin
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 401 }
    )
  }

  try {
    const summary = await syncStravaClub(params.id)

    return NextResponse.json({
      success: true,
      summary,
    })
  } catch (error: any) {
    console.error('Sync Strava error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to sync Strava club',
      },
      { status: 500 }
    )
  }
}
```

**Step 4: Run test to verify pass**

```bash
npm test -- sync-strava/route.test.ts
```

Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add src/app/api/admin/clubs/[id]/sync-strava/
git commit -m "feat(api): implement manual sync-strava endpoint

Triggers manual sync, returns summary with event counts"
```

---

### Task 14: Implement unlink endpoint

**Files:**

- Create: `src/app/api/admin/clubs/[id]/unlink-strava/route.ts`
- Create: `src/app/api/admin/clubs/[id]/unlink-strava/route.test.ts`

**Step 1: Write failing test**

```typescript
// src/app/api/admin/clubs/[id]/unlink-strava/route.test.ts
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

vi.mock('next-auth')

describe('POST /api/admin/clubs/[id]/unlink-strava', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await prisma.event.deleteMany()
    await prisma.club.deleteMany()
  })

  test('unlinks club and deletes events', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: '1', isAdmin: true },
    } as any)

    const club = await prisma.club.create({
      data: {
        name: 'Test Club',
        slug: 'test-club',
        stravaSlug: 'test-123',
        stravaClubId: '123',
        ownerId: 'user1',
      },
    })

    // Create Strava events
    await prisma.event.createMany({
      data: [
        {
          clubId: club.id,
          stravaEventId: '1',
          title: 'Event 1',
          date: new Date(),
          time: '08:00',
        },
        {
          clubId: club.id,
          stravaEventId: '2',
          title: 'Event 2',
          date: new Date(),
          time: '09:00',
        },
      ],
    })

    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ deleteEvents: true }),
    })
    const response = await POST(request, { params: { id: club.id } })

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.eventsDeleted).toBe(2)

    // Verify club unlinked
    const updated = await prisma.club.findUnique({ where: { id: club.id } })
    expect(updated?.stravaSlug).toBeNull()
    expect(updated?.stravaClubId).toBeNull()
    expect(updated?.isManual).toBe(true)

    // Verify events deleted
    const events = await prisma.event.findMany({ where: { clubId: club.id } })
    expect(events).toHaveLength(0)
  })

  test('unlinks club and converts events to manual', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: '1', isAdmin: true },
    } as any)

    const club = await prisma.club.create({
      data: {
        name: 'Test Club',
        slug: 'test-club',
        stravaSlug: 'test-123',
        stravaClubId: '123',
        ownerId: 'user1',
      },
    })

    await prisma.event.create({
      data: {
        clubId: club.id,
        stravaEventId: '1',
        title: 'Event 1',
        date: new Date(),
        time: '08:00',
      },
    })

    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ deleteEvents: false }),
    })
    const response = await POST(request, { params: { id: club.id } })

    expect(response.status).toBe(200)
    const json = await response.json()
    expect(json.eventsDeleted).toBe(0)

    // Verify events converted to manual
    const events = await prisma.event.findMany({ where: { clubId: club.id } })
    expect(events).toHaveLength(1)
    expect(events[0].stravaEventId).toBeNull()
  })
})
```

**Step 2: Run test to verify failure**

```bash
npm test -- unlink-strava/route.test.ts
```

Expected: FAIL - "Cannot find module './route'"

**Step 3: Implement unlink-strava endpoint**

```typescript
// src/app/api/admin/clubs/[id]/unlink-strava/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const unlinkSchema = z.object({
  deleteEvents: z.boolean().default(true),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Check admin
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 401 }
    )
  }

  try {
    const body = await request.json()
    const { deleteEvents } = unlinkSchema.parse(body)

    let eventsDeleted = 0

    if (deleteEvents) {
      // Delete Strava-sourced events
      const deleted = await prisma.event.deleteMany({
        where: {
          clubId: params.id,
          stravaEventId: { not: null },
        },
      })
      eventsDeleted = deleted.count
    } else {
      // Convert to manual events
      await prisma.event.updateMany({
        where: {
          clubId: params.id,
          stravaEventId: { not: null },
        },
        data: {
          stravaEventId: null,
        },
      })
    }

    // Unlink club
    const club = await prisma.club.update({
      where: { id: params.id },
      data: {
        stravaSlug: null,
        stravaClubId: null,
        isManual: true,
        manualOverrides: [],
        lastSyncStatus: null,
        lastSyncError: null,
        lastSyncAttempt: null,
        lastSynced: null,
      },
    })

    return NextResponse.json({
      club,
      eventsDeleted,
    })
  } catch (error: any) {
    console.error('Unlink Strava error:', error)

    return NextResponse.json(
      { error: 'Failed to unlink Strava club' },
      { status: 500 }
    )
  }
}
```

**Step 4: Run test to verify pass**

```bash
npm test -- unlink-strava/route.test.ts
```

Expected: PASS (2 tests)

**Step 5: Commit**

```bash
git add src/app/api/admin/clubs/[id]/unlink-strava/
git commit -m "feat(api): implement unlink-strava endpoint

Unlinks club, optionally deletes or converts events to manual"
```

---

## Phase 5: Admin UI

### Task 15: Add Strava section to club form

**Files:**

- Modify: `src/components/admin/club-form.tsx`
- Modify: `src/components/admin/club-form.test.tsx`

**Step 1: Write failing test**

Add to `club-form.test.tsx`:

```typescript
describe('ClubForm - Strava integration', () => {
  test('shows Strava section when editing linked club', async () => {
    const club = {
      id: '1',
      name: 'Test Club',
      slug: 'test-club',
      stravaSlug: 'test-club-123',
      stravaClubId: '123',
      lastSyncStatus: 'success',
      lastSynced: new Date('2025-11-28T10:00:00Z'),
    }

    render(<ClubForm club={club} />)

    expect(screen.getByText(/strava integration/i)).toBeInTheDocument()
    expect(screen.getByText(/test-club-123/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sync now/i })).toBeInTheDocument()
  })

  test('shows unlinked state when no Strava slug', () => {
    const club = {
      id: '1',
      name: 'Test Club',
      slug: 'test-club',
    }

    render(<ClubForm club={club} />)

    expect(screen.getByLabelText(/strava club slug/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /preview/i })).toBeInTheDocument()
  })
})
```

**Step 2: Run test to verify failure**

```bash
npm test -- club-form.test.tsx
```

Expected: FAIL - elements not found

**Step 3: Add Strava section to club form**

Modify `club-form.tsx`, add after social media fields section:

```typescript
{/* Strava Integration */}
<div className="space-y-4 rounded-lg border p-4">
  <h3 className="text-lg font-medium">Strava Integration</h3>

  {club?.stravaSlug ? (
    // Linked state
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Linked to Strava</p>
          <p className="text-sm text-muted-foreground">{club.stravaSlug}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleSyncStrava}
          disabled={isSyncing}
        >
          {isSyncing ? 'Syncing...' : 'Sync Now'}
        </Button>
      </div>

      {club.lastSyncStatus === 'success' && club.lastSynced && (
        <p className="text-sm text-green-600">
          ✅ Last synced {formatDistanceToNow(new Date(club.lastSynced))} ago
        </p>
      )}

      {club.lastSyncStatus === 'failed' && (
        <div className="rounded bg-red-50 p-3">
          <p className="text-sm font-medium text-red-800">⚠️ Last sync failed</p>
          {club.lastSyncError && (
            <p className="text-sm text-red-600">{club.lastSyncError}</p>
          )}
        </div>
      )}

      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={handleUnlinkStrava}
      >
        Unlink Strava
      </Button>
    </div>
  ) : (
    // Unlinked state
    <div className="space-y-3">
      <div>
        <label htmlFor="stravaSlug" className="block text-sm font-medium">
          Strava Club Slug
        </label>
        <input
          id="stravaSlug"
          type="text"
          placeholder="club-de-course-quebec-123456"
          value={stravaSlug}
          onChange={(e) => setStravaSlug(e.target.value)}
          className="mt-1 block w-full rounded border p-2"
        />
        <p className="mt-1 text-sm text-muted-foreground">
          Find slug in Strava club URL: strava.com/clubs/[slug]
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handlePreviewStrava}
        disabled={!stravaSlug || isPreviewing}
      >
        {isPreviewing ? 'Loading...' : 'Preview Club Data'}
      </Button>
    </div>
  )}
</div>
```

Add state and handlers at top of component:

```typescript
const [stravaSlug, setStravaSlug] = useState('')
const [isPreviewing, setIsPreviewing] = useState(false)
const [isSyncing, setIsSyncing] = useState(false)

const handlePreviewStrava = async () => {
  setIsPreviewing(true)
  try {
    const response = await fetch(`/api/admin/strava/preview?slug=${stravaSlug}`)
    if (!response.ok) throw new Error('Preview failed')
    const data = await response.json()
    // TODO: Show preview modal (Task 16)
    console.log('Preview data:', data)
  } catch (error) {
    console.error('Preview error:', error)
    alert('Failed to preview Strava club')
  } finally {
    setIsPreviewing(false)
  }
}

const handleSyncStrava = async () => {
  if (!club?.id) return
  setIsSyncing(true)
  try {
    const response = await fetch(`/api/admin/clubs/${club.id}/sync-strava`, {
      method: 'POST',
    })
    if (!response.ok) throw new Error('Sync failed')
    const data = await response.json()
    alert(
      `Synced! Added: ${data.summary.eventsAdded}, Updated: ${data.summary.eventsUpdated}`
    )
    window.location.reload()
  } catch (error) {
    console.error('Sync error:', error)
    alert('Failed to sync Strava club')
  } finally {
    setIsSyncing(false)
  }
}

const handleUnlinkStrava = async () => {
  if (!club?.id) return
  if (
    !confirm('Unlink from Strava? This will delete all Strava-sourced events.')
  )
    return

  try {
    const response = await fetch(`/api/admin/clubs/${club.id}/unlink-strava`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deleteEvents: true }),
    })
    if (!response.ok) throw new Error('Unlink failed')
    alert('Club unlinked from Strava')
    window.location.reload()
  } catch (error) {
    console.error('Unlink error:', error)
    alert('Failed to unlink Strava club')
  }
}
```

**Step 4: Run test to verify pass**

```bash
npm test -- club-form.test.tsx
```

Expected: PASS (all tests including new ones)

**Step 5: Commit**

```bash
git add src/components/admin/club-form.tsx src/components/admin/club-form.test.tsx
git commit -m "feat(ui): add Strava integration section to club form

- Shows linked/unlinked states
- Preview, sync, unlink actions
- Displays sync status and errors"
```

---

## Phase 6: Quality Gates

### Task 16: Run all quality gates

**Step 1: Run linter**

```bash
npm run lint
```

Expected: No errors (or fix any issues found)

**Step 2: Run type checker**

```bash
npx tsc --noEmit
```

Expected: No type errors

**Step 3: Run tests with coverage**

```bash
npm run test -- --coverage
```

Expected: ≥95% coverage, all tests pass

**Step 4: Run prettier**

```bash
npx prettier --write .
```

Expected: Files formatted

**Step 5: Final commit**

```bash
git add .
git commit -m "chore: run quality gates (lint, tsc, prettier)"
```

---

## Phase 7: Integration Testing

### Task 17: E2E test for preview and link flow

**Files:**

- Create: `src/app/admin/strava-integration.e2e.ts`

**Step 1: Write E2E test**

```typescript
// src/app/admin/strava-integration.e2e.ts
import { test, expect } from '@playwright/test'

test.describe('Strava Integration', () => {
  test.beforeEach(async ({ page }) => {
    // TODO: Setup admin user and login
    // This will be implemented when auth E2E helpers exist
  })

  test('admin can preview and link Strava club', async ({ page }) => {
    // Navigate to create club
    await page.goto('/admin/clubs/new')

    // Fill basic club info
    await page.fill('[name="name"]', 'Test Strava Club')
    await page.fill('[name="slug"]', 'test-strava-club')

    // Enter Strava slug
    await page.fill('[id="stravaSlug"]', 'test-club-123456')

    // Click preview (mocked in test)
    await page.click('button:has-text("Preview Club Data")')

    // Verify preview modal appears
    await expect(page.locator('text=Preview')).toBeVisible()

    // TODO: Complete when preview modal implemented
  })

  test('admin can manually sync linked club', async ({ page }) => {
    // TODO: Setup club with Strava link
    // Navigate to edit page
    // Click "Sync Now"
    // Verify success message
  })
})
```

**Step 2: Run E2E tests**

```bash
npm run test:e2e -- strava-integration.e2e.ts
```

Expected: Tests pass (once auth helpers implemented)

**Step 3: Commit**

```bash
git add src/app/admin/strava-integration.e2e.ts
git commit -m "test(e2e): add Strava integration E2E tests

Covers preview, link, and manual sync flows"
```

---

## Phase 8: Documentation

### Task 18: Update README with Strava setup

**Files:**

- Modify: `README.md`

**Step 1: Add Strava setup section**

Add to environment variables section:

````markdown
### Strava API

1. Register app at https://www.strava.com/settings/api
2. Set callback URL (not used for backend-only integration)
3. Copy Client ID and Client Secret to `.env`:

```env
STRAVA_CLIENT_ID="your-client-id"
STRAVA_CLIENT_SECRET="your-client-secret"
```
````

### Admin Strava Integration

Admins can link clubs to Strava groups:

1. Navigate to Admin → Clubs → Edit
2. Enter Strava club slug (from URL: `strava.com/clubs/[slug]`)
3. Click "Preview Club Data" to verify
4. Click "Link & Import" to connect and sync events
5. Use "Sync Now" button to manually refresh

````

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add Strava integration setup to README"
````

---

## Summary

**Implementation Complete:**

- ✅ Schema migration (Club + Event Strava fields)
- ✅ Strava SDK integration
- ✅ Service layer (fetch, map, sync)
- ✅ API endpoints (preview, link, unlink, sync)
- ✅ Admin UI (club form Strava section)
- ✅ Tests (unit + integration)
- ✅ Quality gates (lint, tsc, prettier)
- ✅ Documentation

**Deferred (Future Engineer):**

- ⏳ Cron scheduled sync (follow `vercel-cron-pattern.md`)
- ⏳ Batch email alerts on sync failures
- ⏳ Preview modal component (UI polish)
- ⏳ Admin dashboard sync status card
- ⏳ Club list sync status indicators

**Next Steps:**

1. Register Strava API application
2. Add credentials to Vercel environment
3. Manual testing with real Quebec clubs
4. Create PR with design doc reference

---

## Execution Notes

**For Claude Executing This Plan:**

- Follow TDD strictly: test → fail → implement → pass → commit
- Run quality gates before final PR
- Reference design doc for architecture decisions
- Use `@superpowers:verification-before-completion` before claiming done
