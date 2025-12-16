# Map Markers Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add interactive Leaflet map showing event locations with auto-geocoding via OpenStreetMap Nominatim.

**Architecture:** Server-side geocoding service with rate-limited queue (1 req/sec). Event service calls geocoding on create/update. Client-side map component with clustering for dense areas.

**Tech Stack:** Leaflet, react-leaflet, react-leaflet-markercluster, OpenStreetMap Nominatim API, Next.js dynamic imports

---

## Task 1: Install Dependencies

**Files:**

- Modify: `package.json`

**Step 1: Install markercluster dependencies**

```bash
npm install react-leaflet-markercluster@3.0.0-rc1 leaflet.markercluster
npm install -D @types/leaflet.markercluster
```

**Step 2: Verify installation**

Run: `npm list react-leaflet-markercluster leaflet.markercluster`
Expected: Both packages listed

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add markercluster for event map

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: Add geocodedAt Field to Schema

**Files:**

- Modify: `prisma/schema.prisma:136-167`

**Step 1: Add geocodedAt field to Event model**

```prisma
model Event {
  id          String   @id @default(cuid())
  title       String
  description String?

  // Location
  address     String?
  latitude    Float?
  longitude   Float?
  geocodedAt  DateTime? // NEW FIELD

  // Event timing
  date        DateTime
  time        String

  // Event details
  distance    String?
  pace        String?

  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  clubId      String

  // Recurring event link
  recurringEventId String?

  // Relations
  club           Club            @relation(fields: [clubId], references: [id], onDelete: Cascade)
  recurringEvent RecurringEvent? @relation(fields: [recurringEventId], references: [id], onDelete: SetNull)

  @@map("events")
}
```

**Step 2: Create migration**

Run: `npx prisma migrate dev --name add_geocoded_at_to_events`
Expected: Migration created successfully

**Step 3: Verify migration**

Run: `ls prisma/migrations | tail -1`
Expected: Directory with name containing "add_geocoded_at_to_events"

**Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "schema: add geocodedAt timestamp to Event model

Tracks when address was geocoded for cache invalidation.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: Create Geocoding Service

**Files:**

- Create: `src/lib/services/geocoding.ts`
- Create: `src/lib/services/geocoding.test.ts`

**Step 1: Write failing test**

Create `src/lib/services/geocoding.test.ts`:

```typescript
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { geocodeAddress } from './geocoding'

describe('geocodeAddress', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  test('returns lat/lng for valid address', async () => {
    const mockResponse = [{ lat: '46.8139', lon: '-71.2080' }]
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    })

    const result = await geocodeAddress('123 Rue Principale, Quebec City, QC')

    expect(result).toEqual({ lat: 46.8139, lng: -71.208 })
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('nominatim.openstreetmap.org/search'),
      expect.any(Object)
    )
  })

  test('returns null for failed geocoding', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    })

    const result = await geocodeAddress('Invalid Address')

    expect(result).toBeNull()
  })

  test('returns null on network error', async () => {
    ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))

    const result = await geocodeAddress('123 Rue Principale')

    expect(result).toBeNull()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test geocoding.test.ts`
Expected: FAIL - "Cannot find module './geocoding'"

**Step 3: Write minimal implementation**

Create `src/lib/services/geocoding.ts`:

```typescript
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org'
const RATE_LIMIT_MS = 1000 // 1 req/sec per Nominatim usage policy

let lastRequestTime = 0

async function rateLimitedFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime

  if (timeSinceLastRequest < RATE_LIMIT_MS) {
    const delay = RATE_LIMIT_MS - timeSinceLastRequest
    await new Promise((resolve) => setTimeout(resolve, delay))
  }

  lastRequestTime = Date.now()
  return fetch(url, options)
}

export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = new URL(`${NOMINATIM_BASE_URL}/search`)
    url.searchParams.set('q', address)
    url.searchParams.set('format', 'json')
    url.searchParams.set('countrycodes', 'ca')
    url.searchParams.set('limit', '1')

    const response = await rateLimitedFetch(url.toString(), {
      headers: {
        'User-Agent': 'quebec.run (https://quebec.run)',
      },
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      console.warn(`Geocoding failed for address: ${address}`, response.status)
      return null
    }

    const data = await response.json()

    if (!data || data.length === 0) {
      console.warn(`No geocoding results for address: ${address}`)
      return null
    }

    const result = data[0]
    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    }
  } catch (error) {
    console.error(`Geocoding error for address: ${address}`, error)
    return null
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test geocoding.test.ts`
Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add src/lib/services/geocoding.ts src/lib/services/geocoding.test.ts
git commit -m "feat: add geocoding service with rate limiting

OSM Nominatim API, 1 req/sec, 5s timeout, returns null on failure.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: Modify Event Service to Call Geocoding

**Files:**

- Modify: `src/lib/services/events.ts`
- Modify: `src/lib/services/events.test.ts`

**Step 1: Write failing test**

Add to `src/lib/services/events.test.ts` (after existing tests):

```typescript
import { geocodeAddress } from './geocoding'

vi.mock('./geocoding')

describe('createEvent with geocoding', () => {
  test('geocodes address on event create', async () => {
    vi.mocked(geocodeAddress).mockResolvedValueOnce({
      lat: 46.8139,
      lng: -71.208,
    })

    const club = await prisma.club.create({
      data: {
        name: 'Test Club',
        slug: 'test-club',
        ownerId: testUser.id,
      },
    })

    const event = await createEvent({
      user: adminUser,
      data: {
        title: 'Test Event',
        date: '2025-12-01',
        time: '18:00',
        address: '123 Rue Principale, Quebec City, QC',
        clubId: club.id,
      },
    })

    expect(geocodeAddress).toHaveBeenCalledWith(
      '123 Rue Principale, Quebec City, QC'
    )
    expect(event.latitude).toBe(46.8139)
    expect(event.longitude).toBe(-71.208)
    expect(event.geocodedAt).toBeInstanceOf(Date)
  })

  test('saves event without coords if geocoding fails', async () => {
    vi.mocked(geocodeAddress).mockResolvedValueOnce(null)

    const club = await prisma.club.create({
      data: {
        name: 'Test Club',
        slug: 'test-club-2',
        ownerId: testUser.id,
      },
    })

    const event = await createEvent({
      user: adminUser,
      data: {
        title: 'Test Event',
        date: '2025-12-01',
        time: '18:00',
        address: 'Invalid Address',
        clubId: club.id,
      },
    })

    expect(event.latitude).toBeNull()
    expect(event.longitude).toBeNull()
    expect(event.geocodedAt).toBeNull()
  })
})

describe('updateEvent with geocoding', () => {
  test('re-geocodes when address changes', async () => {
    vi.mocked(geocodeAddress)
      .mockResolvedValueOnce({ lat: 46.8139, lng: -71.208 })
      .mockResolvedValueOnce({ lat: 45.5017, lng: -73.5673 })

    const club = await prisma.club.create({
      data: {
        name: 'Test Club',
        slug: 'test-club-3',
        ownerId: testUser.id,
      },
    })

    const event = await prisma.event.create({
      data: {
        title: 'Test Event',
        date: new Date('2025-12-01'),
        time: '18:00',
        address: 'Old Address',
        latitude: 46.8139,
        longitude: -71.208,
        geocodedAt: new Date(),
        clubId: club.id,
      },
    })

    const updated = await updateEvent({
      user: adminUser,
      data: {
        id: event.id,
        address: 'New Address, Montreal',
      },
    })

    expect(geocodeAddress).toHaveBeenCalledWith('New Address, Montreal')
    expect(updated.latitude).toBe(45.5017)
    expect(updated.longitude).toBe(-73.5673)
  })

  test('does not re-geocode if address unchanged', async () => {
    vi.mocked(geocodeAddress).mockClear()

    const club = await prisma.club.create({
      data: {
        name: 'Test Club',
        slug: 'test-club-4',
        ownerId: testUser.id,
      },
    })

    const event = await prisma.event.create({
      data: {
        title: 'Test Event',
        date: new Date('2025-12-01'),
        time: '18:00',
        address: 'Same Address',
        latitude: 46.8139,
        longitude: -71.208,
        geocodedAt: new Date(),
        clubId: club.id,
      },
    })

    await updateEvent({
      user: adminUser,
      data: {
        id: event.id,
        title: 'Updated Title',
      },
    })

    expect(geocodeAddress).not.toHaveBeenCalled()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test events.test.ts`
Expected: FAIL - tests fail because geocoding not integrated

**Step 3: Modify createEvent function**

In `src/lib/services/events.ts`, import geocoding at top:

```typescript
import { geocodeAddress } from './geocoding'
```

Modify `createEvent` function to geocode (find the function and update):

```typescript
export async function createEvent({
  user,
  data,
}: AuthPayload<EventCreate>): Promise<EventWithClub> {
  if (!user.isAdmin) {
    throw new Error('Unauthorized: Admin access required')
  }

  const validatedData = eventCreateSchema.parse(data)

  // Geocode address if provided
  let latitude: number | null = null
  let longitude: number | null = null
  let geocodedAt: Date | null = null

  if (validatedData.address) {
    const coords = await geocodeAddress(validatedData.address)
    if (coords) {
      latitude = coords.lat
      longitude = coords.lng
      geocodedAt = new Date()
    }
  }

  const event = await prisma.event.create({
    data: {
      title: validatedData.title,
      description: validatedData.description || null,
      date: new Date(validatedData.date),
      time: validatedData.time,
      address: validatedData.address || null,
      latitude,
      longitude,
      geocodedAt,
      distance: validatedData.distance || null,
      pace: validatedData.pace || null,
      clubId: validatedData.clubId,
    },
    include: {
      club: true,
    },
  })

  return event
}
```

**Step 4: Modify updateEvent function**

Modify `updateEvent` to re-geocode when address changes:

```typescript
export async function updateEvent({
  user,
  data,
}: AuthPayload<EventUpdate>): Promise<EventWithClub> {
  if (!user.isAdmin) {
    throw new Error('Unauthorized: Admin access required')
  }

  const validatedData = eventUpdateSchema.parse(data)
  const { id, ...updateData } = validatedData

  // Check if address changed
  const existingEvent = await prisma.event.findUnique({
    where: { id },
    select: { address: true },
  })

  if (!existingEvent) {
    throw new Error('Event not found')
  }

  // Re-geocode if address changed
  let geocodeUpdate: {
    latitude?: number | null
    longitude?: number | null
    geocodedAt?: Date | null
  } = {}

  if (updateData.address && updateData.address !== existingEvent.address) {
    const coords = await geocodeAddress(updateData.address)
    if (coords) {
      geocodeUpdate = {
        latitude: coords.lat,
        longitude: coords.lng,
        geocodedAt: new Date(),
      }
    } else {
      geocodeUpdate = {
        latitude: null,
        longitude: null,
        geocodedAt: null,
      }
    }
  }

  const event = await prisma.event.update({
    where: { id },
    data: {
      ...updateData,
      ...geocodeUpdate,
      date: updateData.date ? new Date(updateData.date) : undefined,
    },
    include: {
      club: true,
    },
  })

  return event
}
```

**Step 5: Run test to verify it passes**

Run: `npm test events.test.ts`
Expected: PASS (all tests including new geocoding tests)

**Step 6: Commit**

```bash
git add src/lib/services/events.ts src/lib/services/events.test.ts
git commit -m "feat: integrate geocoding into event create/update

Auto-geocode on create, re-geocode when address changes, skip if unchanged.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: Create EventMap Component

**Files:**

- Create: `src/components/map/event-map.tsx`
- Create: `src/components/map/event-map.test.tsx`
- Create: `src/components/map/event-map.stories.tsx`

**Step 1: Write failing test**

Create `src/components/map/event-map.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { describe, test, expect } from 'vitest'
import { EventMap } from './event-map'

describe('EventMap', () => {
  const mockEvents = [
    {
      id: '1',
      title: 'Test Event 1',
      date: new Date('2025-12-01'),
      time: '18:00',
      address: 'Quebec City',
      latitude: 46.8139,
      longitude: -71.208,
      clubId: 'club1',
      club: { id: 'club1', name: 'Test Club', slug: 'test-club' },
    },
    {
      id: '2',
      title: 'Test Event 2',
      date: new Date('2025-12-02'),
      time: '19:00',
      address: 'Montreal',
      latitude: 45.5017,
      longitude: -73.5673,
      clubId: 'club1',
      club: { id: 'club1', name: 'Test Club', slug: 'test-club' },
    },
  ]

  test('renders map container', () => {
    render(<EventMap events={mockEvents} />)
    const mapContainer = screen.getByRole('application', {
      name: /interactive event map/i,
    })
    expect(mapContainer).toBeInTheDocument()
  })

  test('shows empty state when no events have coordinates', () => {
    const eventsWithoutCoords = [
      {
        id: '3',
        title: 'No Coords Event',
        date: new Date('2025-12-01'),
        time: '18:00',
        address: null,
        latitude: null,
        longitude: null,
        clubId: 'club1',
        club: { id: 'club1', name: 'Test Club', slug: 'test-club' },
      },
    ]

    render(<EventMap events={eventsWithoutCoords} />)
    expect(
      screen.getByText(/events will appear on the map once addresses are geocoded/i)
    ).toBeInTheDocument()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test event-map.test.tsx`
Expected: FAIL - "Cannot find module './event-map'"

**Step 3: Write minimal implementation**

Create `src/components/map/event-map.tsx`:

```typescript
'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import type { EventWithClub } from '@/lib/schemas'
import 'leaflet/dist/leaflet.css'

// Dynamic import to avoid SSR issues with Leaflet
const MapContent = dynamic(() => import('./event-map-content'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] md:h-[600px] w-full bg-gray-100 animate-pulse rounded-lg" />
  ),
})

interface EventMapProps {
  events: Pick<
    EventWithClub,
    'id' | 'title' | 'date' | 'time' | 'address' | 'latitude' | 'longitude' | 'club'
  >[]
  initialCenter?: [number, number]
  initialZoom?: number
}

export function EventMap({
  events,
  initialCenter = [46.8139, -71.208], // Quebec City
  initialZoom = 10,
}: EventMapProps) {
  const eventsWithCoords = useMemo(
    () =>
      events.filter(
        (event): event is typeof event & { latitude: number; longitude: number } =>
          event.latitude !== null && event.longitude !== null
      ),
    [events]
  )

  if (eventsWithCoords.length === 0) {
    return (
      <div
        className="h-[400px] md:h-[600px] w-full bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center"
        role="application"
        aria-label="Interactive event map"
      >
        <p className="text-gray-500 text-center px-4">
          Events will appear on the map once addresses are geocoded.
        </p>
      </div>
    )
  }

  return (
    <div
      className="h-[400px] md:h-[600px] w-full rounded-lg overflow-hidden"
      role="application"
      aria-label="Interactive event map"
    >
      <MapContent
        events={eventsWithCoords}
        initialCenter={initialCenter}
        initialZoom={initialZoom}
      />
    </div>
  )
}
```

Create `src/components/map/event-map-content.tsx`:

```typescript
'use client'

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-markercluster'
import { Icon } from 'leaflet'
import { format } from 'date-fns'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'

// Fix default marker icon issue with Leaflet + bundlers
const defaultIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

interface EventMapContentProps {
  events: Array<{
    id: string
    title: string
    date: Date
    time: string
    address: string | null
    latitude: number
    longitude: number
    club: { id: string; name: string; slug: string }
  }>
  initialCenter: [number, number]
  initialZoom: number
}

export default function EventMapContent({
  events,
  initialCenter,
  initialZoom,
}: EventMapContentProps) {
  return (
    <MapContainer
      center={initialCenter}
      zoom={initialZoom}
      scrollWheelZoom={true}
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MarkerClusterGroup>
        {events.map((event) => (
          <Marker
            key={event.id}
            position={[event.latitude, event.longitude]}
            icon={defaultIcon}
          >
            <Popup>
              <div className="min-w-[200px]">
                <h3 className="font-heading font-semibold text-primary text-lg mb-2">
                  {event.title}
                </h3>
                <div className="space-y-1 text-sm text-accent mb-3">
                  <p>
                    <strong>Date:</strong> {format(event.date, 'PPP')}
                  </p>
                  <p>
                    <strong>Time:</strong> {event.time}
                  </p>
                  <p>
                    <strong>Club:</strong>{' '}
                    <Link
                      href={`/clubs/${event.club.slug}`}
                      className="text-primary hover:underline"
                    >
                      {event.club.name}
                    </Link>
                  </p>
                  {event.address && (
                    <p>
                      <strong>Address:</strong> {event.address}
                    </p>
                  )}
                </div>
                <Link href={`/events/${event.id}`}>
                  <Button size="sm" variant="primary" className="w-full">
                    View Details
                  </Button>
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  )
}
```

**Step 4: Run test to verify it passes**

Run: `npm test event-map.test.tsx`
Expected: PASS (2 tests)

**Step 5: Create Storybook story**

Create `src/components/map/event-map.stories.tsx`:

```typescript
import type { Meta, StoryObj } from '@storybook/react'
import { EventMap } from './event-map'

const meta: Meta<typeof EventMap> = {
  title: 'Map/EventMap',
  component: EventMap,
  parameters: {
    layout: 'fullscreen',
  },
}

export default meta
type Story = StoryObj<typeof EventMap>

const mockEvents = [
  {
    id: '1',
    title: 'Morning Run - Old Quebec',
    date: new Date('2025-12-01T09:00:00'),
    time: '09:00',
    address: '1 Rue des Carrières, Quebec City, QC',
    latitude: 46.8139,
    longitude: -71.208,
    clubId: 'club1',
    club: { id: 'club1', name: 'Quebec Runners', slug: 'quebec-runners' },
  },
  {
    id: '2',
    title: 'Evening Trail Run',
    date: new Date('2025-12-01T18:00:00'),
    time: '18:00',
    address: '2 Avenue du Parc, Quebec City, QC',
    latitude: 46.8239,
    longitude: -71.218,
    clubId: 'club1',
    club: { id: 'club1', name: 'Quebec Runners', slug: 'quebec-runners' },
  },
  {
    id: '3',
    title: 'Weekend Long Run',
    date: new Date('2025-12-07T08:00:00'),
    time: '08:00',
    address: 'Plains of Abraham, Quebec City, QC',
    latitude: 46.8029,
    longitude: -71.216,
    clubId: 'club2',
    club: { id: 'club2', name: 'Trail Runners QC', slug: 'trail-runners-qc' },
  },
]

const manyEvents = Array.from({ length: 50 }, (_, i) => ({
  id: `event-${i}`,
  title: `Run Event ${i + 1}`,
  date: new Date('2025-12-01T09:00:00'),
  time: '09:00',
  address: `${i} Rue Example, Quebec City, QC`,
  latitude: 46.8139 + (Math.random() - 0.5) * 0.1,
  longitude: -71.208 + (Math.random() - 0.5) * 0.1,
  clubId: 'club1',
  club: { id: 'club1', name: 'Quebec Runners', slug: 'quebec-runners' },
}))

export const Default: Story = {
  args: {
    events: mockEvents,
  },
}

export const SingleEvent: Story = {
  args: {
    events: [mockEvents[0]],
  },
}

export const ManyEvents: Story = {
  args: {
    events: manyEvents,
  },
}

export const NoGeocodedEvents: Story = {
  args: {
    events: [
      {
        id: '4',
        title: 'Event Without Coordinates',
        date: new Date('2025-12-01T09:00:00'),
        time: '09:00',
        address: null,
        latitude: null,
        longitude: null,
        clubId: 'club1',
        club: { id: 'club1', name: 'Quebec Runners', slug: 'quebec-runners' },
      },
    ],
  },
}

export const Empty: Story = {
  args: {
    events: [],
  },
}
```

**Step 6: Verify story renders**

Run: `npm run storybook`
Navigate to: `Map/EventMap`
Expected: All 5 stories render correctly

**Step 7: Commit**

```bash
git add src/components/map/
git commit -m "feat: add EventMap component with clustering

Dynamic import for SSR, markercluster for dense areas, empty state.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 6: Add i18n Translations

**Files:**

- Modify: `messages/en.json`
- Modify: `messages/fr.json`

**Step 1: Add English translations**

Add to `messages/en.json` under `"home"` key:

```json
{
  "home": {
    "hero": {
      "title": "Discover Running Events in Quebec",
      "description": "Find running clubs, events, and connect with the local running community.",
      "findEvents": "Find Events",
      "browseClubs": "Browse Clubs",
      "mapTitle": "Discover Events Near You",
      "mapDescription": "Interactive map coming soon"
    },
    "map": {
      "title": "Events Near You",
      "emptyState": "Events will appear on the map once addresses are geocoded"
    }
  }
}
```

**Step 2: Add French translations**

Add to `messages/fr.json` under `"home"` key:

```json
{
  "home": {
    "hero": {
      "title": "Découvrez les événements de course au Québec",
      "description": "Trouvez des clubs de course, des événements et connectez-vous avec la communauté locale de coureurs.",
      "findEvents": "Trouver des événements",
      "browseClubs": "Parcourir les clubs",
      "mapTitle": "Découvrez les événements près de chez vous",
      "mapDescription": "Carte interactive bientôt disponible"
    },
    "map": {
      "title": "Événements près de chez vous",
      "emptyState": "Les événements apparaîtront sur la carte une fois les adresses géocodées"
    }
  }
}
```

**Step 3: Commit**

```bash
git add messages/en.json messages/fr.json
git commit -m "i18n: add map translations for en/fr

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 7: Add EventMap to Homepage

**Files:**

- Modify: `src/app/[locale]/page.tsx`

**Step 1: Import EventMap and fetch events**

Modify `src/app/[locale]/page.tsx`:

```typescript
'use client'

import { useTranslations } from 'next-intl'
import { useClubs } from '@/lib/hooks/use-clubs'
import { useEvents } from '@/lib/hooks/use-events'
import { ClubCard } from '@/components/clubs/club-card'
import { Button } from '@/components/ui/button'
import { ContentGrid } from '@/components/ui/content-grid'
import { LoadingGrid, LoadingCard } from '@/components/ui/loading-card'
import { EventMap } from '@/components/map/event-map'
import { MapPin, Search, Filter, Calendar } from 'lucide-react'
import { Link } from '@/i18n/navigation'

export default function Home() {
  const t = useTranslations('home')
  const { data: clubs, isLoading: clubsLoading } = useClubs()
  const { data: events, isLoading: eventsLoading } = useEvents()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-heading font-bold text-primary mb-6">
                {t('hero.title')}
              </h1>
              <p className="text-xl text-accent mb-8 font-body leading-relaxed">
                {t('hero.description')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/events">
                  <Button size="lg" variant="primary">
                    {t('hero.findEvents')}
                  </Button>
                </Link>
                <Link href="/clubs">
                  <Button size="lg" variant="outline-accent">
                    {t('hero.browseClubs')}
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              {eventsLoading ? (
                <div className="aspect-square bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl animate-pulse" />
              ) : (
                <EventMap events={events || []} />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-12 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-heading font-bold text-primary text-center mb-8">
              {t('search.title')}
            </h2>
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-accent"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder={t('search.placeholder')}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary font-body"
                  />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline-accent">
                    <Filter size={18} className="mr-2" />
                    {t('search.filters')}
                  </Button>
                  <Button variant="secondary">
                    {t('search.searchButton')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Clubs Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-heading font-bold text-primary">
              {t('clubs.title')}
            </h2>
            <Link href="/clubs">
              <Button variant="outline-primary">{t('clubs.viewAll')}</Button>
            </Link>
          </div>

          {clubsLoading ? (
            <LoadingGrid count={6}>
              <LoadingCard />
            </LoadingGrid>
          ) : (
            <ContentGrid>
              {clubs?.slice(0, 6).map((club) => (
                <ClubCard key={club.id} club={club} />
              ))}
            </ContentGrid>
          )}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-16 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-8">
              <div className="flex items-center mb-4">
                <Calendar className="text-primary mr-3" size={32} />
                <h3 className="text-2xl font-heading font-bold text-primary">
                  {t('quickActions.events.title')}
                </h3>
              </div>
              <p className="text-accent font-body mb-6">
                {t('quickActions.events.description')}
              </p>
              <Link href="/events">
                <Button variant="primary">
                  {t('quickActions.events.button')}
                </Button>
              </Link>
            </div>

            <div className="bg-gradient-to-br from-secondary/5 to-secondary/10 rounded-2xl p-8">
              <div className="flex items-center mb-4">
                <MapPin className="text-secondary mr-3" size={32} />
                <h3 className="text-2xl font-heading font-bold text-secondary">
                  {t('quickActions.routes.title')}
                </h3>
              </div>
              <p className="text-accent font-body mb-6">
                {t('quickActions.routes.description')}
              </p>
              <Link href="/calendar">
                <Button variant="secondary">
                  {t('quickActions.routes.button')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
```

**Step 2: Verify homepage renders**

Run: `npm run dev`
Navigate to: `http://localhost:3000`
Expected: Homepage renders with map (or empty state if no geocoded events)

**Step 3: Commit**

```bash
git add src/app/[locale]/page.tsx
git commit -m "feat: add EventMap to homepage hero section

Replaces placeholder with interactive map.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 8: Add EventMap to Events Page

**Files:**

- Modify: `src/app/[locale]/events/page.tsx`

**Step 1: Add EventMap above event list**

Modify `src/app/[locale]/events/page.tsx`:

```typescript
import { getTranslations } from 'next-intl/server'
import { getAllEvents } from '@/lib/services/events'
import { EventCard } from '@/components/events/event-card'
import { EventMap } from '@/components/map/event-map'
import { ContentGrid } from '@/components/ui/content-grid'
import { PageContainer } from '@/components/ui/page-container'
import { PageTitle } from '@/components/ui/page-title'
import { EmptyState } from '@/components/ui/empty-state'
import { Calendar } from 'lucide-react'

export default async function EventsPage() {
  const t = await getTranslations('events')
  const events = await getAllEvents({ data: {} })

  return (
    <PageContainer>
      <PageTitle>{t('title')}</PageTitle>

      {/* Map Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-heading font-bold text-primary mb-4">
          {t('map.title', { defaultValue: 'Events Near You' })}
        </h2>
        <EventMap events={events} />
      </section>

      {/* Event List Section */}
      <section>
        <h2 className="text-2xl font-heading font-bold text-primary mb-4">
          {t('list.title', { defaultValue: 'All Events' })}
        </h2>
        {events.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title={t('empty.title')}
            description={t('empty.description')}
          />
        ) : (
          <ContentGrid>
            {events.map((event) => (
              <EventCard key={event.id} event={event} showClubName />
            ))}
          </ContentGrid>
        )}
      </section>
    </PageContainer>
  )
}
```

**Step 2: Add events page translations**

Add to `messages/en.json` under `"events"`:

```json
{
  "events": {
    "title": "Running Events",
    "map": {
      "title": "Events Near You"
    },
    "list": {
      "title": "All Events"
    },
    "empty": {
      "title": "No events yet",
      "description": "Check back soon for upcoming running events"
    }
  }
}
```

Add to `messages/fr.json` under `"events"`:

```json
{
  "events": {
    "title": "Événements de course",
    "map": {
      "title": "Événements près de chez vous"
    },
    "list": {
      "title": "Tous les événements"
    },
    "empty": {
      "title": "Aucun événement pour le moment",
      "description": "Revenez bientôt pour les prochains événements de course"
    }
  }
}
```

**Step 3: Verify events page renders**

Run: `npm run dev`
Navigate to: `http://localhost:3000/events`
Expected: Events page renders with map above list

**Step 4: Commit**

```bash
git add src/app/[locale]/events/page.tsx messages/en.json messages/fr.json
git commit -m "feat: add EventMap to events page

Map above list view, list/map sections with headers.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 9: Create Backfill Script

**Files:**

- Create: `prisma/scripts/backfill-geocoding.ts`

**Step 1: Create backfill script**

Create `prisma/scripts/backfill-geocoding.ts`:

```typescript
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

    // Respect rate limit (1 req/sec)
    await new Promise((resolve) => setTimeout(resolve, 1100))
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
```

**Step 2: Add script to package.json**

Add to `package.json` scripts:

```json
{
  "scripts": {
    "db:backfill-geocoding": "tsx prisma/scripts/backfill-geocoding.ts"
  }
}
```

**Step 3: Document script usage**

Add to plan (no commit yet):

````markdown
## Running Backfill Script

After deployment, run once to geocode existing events:

```bash
npm run db:backfill-geocoding
```
````

This will geocode all events with addresses but no coordinates.
Rate-limited to 1 request per second (~3600 events/hour).

````

**Step 4: Commit**

```bash
git add prisma/scripts/backfill-geocoding.ts package.json
git commit -m "feat: add geocoding backfill script

Rate-limited batch geocoding for existing events.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
````

**How to run the backfill script:**

After deployment, run once to geocode existing events:

```bash
npm run db:backfill-geocoding
```

This will geocode all events with addresses but no coordinates.
Rate-limited to 1 request per second (~3600 events/hour).

---

## Task 10: Add E2E Tests

**Files:**

- Create: `e2e/map-markers.spec.ts`

**Step 1: Write E2E test**

Create `e2e/map-markers.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'

test.describe('Map Markers', () => {
  test('displays event map on homepage', async ({ page }) => {
    await page.goto('/')

    // Wait for map to load
    const map = page.getByRole('application', {
      name: /interactive event map/i,
    })
    await expect(map).toBeVisible()
  })

  test('displays event map on events page', async ({ page }) => {
    await page.goto('/events')

    // Wait for map to load
    const map = page.getByRole('application', {
      name: /interactive event map/i,
    })
    await expect(map).toBeVisible()

    // Should have section headers
    await expect(
      page.getByRole('heading', { name: /events near you/i })
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: /all events/i })
    ).toBeVisible()
  })

  test('shows empty state when no geocoded events', async ({ page }) => {
    // This test assumes a clean DB or no geocoded events
    await page.goto('/events')

    const emptyMessage = page.getByText(
      /events will appear on the map once addresses are geocoded/i
    )
    await expect(emptyMessage).toBeVisible()
  })
})
```

**Step 2: Run E2E tests**

Run: `npm run test:e2e`
Expected: PASS (3 tests)

**Step 3: Commit**

```bash
git add e2e/map-markers.spec.ts
git commit -m "test: add E2E tests for map markers

Homepage map, events page map, empty state.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 11: Run Quality Gates

**Files:**

- None (verification only)

**Step 1: Run linter**

Run: `npm run lint`
Expected: No errors

**Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: No errors

**Step 3: Run tests with coverage**

Run: `npm run test:coverage`
Expected: ≥95% coverage, all tests pass

**Step 4: Run prettier**

Run: `npx prettier --write .`
Expected: Files formatted

**Step 5: Build project**

Run: `npm run build`
Expected: Build succeeds

**Step 6: Run Storybook build**

Run: `npm run build-storybook`
Expected: Build succeeds

---

## Task 12: Final Commit and Push

**Step 1: Commit any remaining changes**

```bash
git add .
git commit -m "chore: format and verify quality gates

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Step 2: Push branch**

```bash
git push -u origin maferland/map-markers
```

**Step 3: Verify push succeeded**

Run: `git status`
Expected: "Your branch is up to date with 'origin/maferland/map-markers'"

---

## Post-Implementation

After all tasks complete:

1. **Create PR** using superpowers:finishing-a-development-branch skill
2. **Run backfill script** in production: `npm run db:backfill-geocoding`
3. **Monitor logs** for geocoding failures
4. **Verify map** on production homepage and events page

---

## Troubleshooting

**Leaflet SSR errors:**

- Ensure `next/dynamic` with `ssr: false`
- Import CSS in client component only

**Rate limit exceeded:**

- Verify 1 req/sec in geocoding service
- Check rate limit queue implementation

**Markers not appearing:**

- Verify events have non-null lat/lng
- Check browser console for Leaflet errors
- Confirm marker icon URLs accessible

**Map not rendering:**

- Check Leaflet CSS imports
- Verify TileLayer URL correct
- Inspect browser network tab for tile loading
