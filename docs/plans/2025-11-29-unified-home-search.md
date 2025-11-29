# Unified Home Search Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace club-name-only search on home with unified search filtering both events (by title/address/club name) and clubs (by name) simultaneously.

**Architecture:** Single search input → events query (debounced, server-side) + clubs filter (instant, client-side) → dual result sections with counts.

**Tech Stack:** React Query, Next.js App Router, Prisma, Zod, React hooks

---

## Phase 1: Backend - Club Name Search

### Task 1: Add club name search to getAllEvents

**Files:**

- Modify: `src/lib/services/events.ts:100-105` (OR clause in where)
- Test: `src/lib/services/events.test.ts`

**Step 1: Write failing test**

Add to `src/lib/services/events.test.ts` after existing "getAllEvents with filtering" tests:

```typescript
it('filters by club name in search', async () => {
  await prisma.event.deleteMany()
  await prisma.club.deleteMany()
  await prisma.user.deleteMany()

  const user = await prisma.user.create({
    data: { email: 'owner@test.com', name: 'Owner' },
  })

  const club = await prisma.club.create({
    data: {
      name: '6AM Club Montcalm',
      slug: '6am-club',
      ownerId: user.id,
    },
  })

  await prisma.event.create({
    data: {
      title: 'Morning Run',
      date: new Date('2025-12-15'),
      time: '08:00',
      address: '123 Test Street',
      clubId: club.id,
    },
  })

  const result = await getAllEvents({ data: { search: '6AM' } })
  expect(result).toHaveLength(1)
  expect(result[0].title).toBe('Morning Run')
  expect(result[0].club.name).toBe('6AM Club Montcalm')
})

it('filters by club name case-insensitive', async () => {
  const result = await getAllEvents({ data: { search: 'montcalm' } })
  expect(result).toHaveLength(1)
  expect(result[0].club.name).toContain('Montcalm')
})
```

**Step 2: Run test to verify it fails**

```bash
npm test -- src/lib/services/events.test.ts -t "filters by club name"
```

Expected: FAIL - "Expected 1, received 0" (club name not searched)

**Step 3: Update getAllEvents implementation**

In `src/lib/services/events.ts`, find the search OR clause (around line 100-105):

```typescript
...(search && {
  OR: [
    { title: { contains: search, mode: 'insensitive' } },
    { address: { contains: search, mode: 'insensitive' } },
  ],
}),
```

Replace with:

```typescript
...(search && {
  OR: [
    { title: { contains: search, mode: 'insensitive' } },
    { address: { contains: search, mode: 'insensitive' } },
    { club: { name: { contains: search, mode: 'insensitive' } } },
  ],
}),
```

**Step 4: Run test to verify it passes**

```bash
npm test -- src/lib/services/events.test.ts -t "filters by club name"
```

Expected: PASS (2 new tests)

**Step 5: Run full events test suite**

```bash
npm test -- src/lib/services/events.test.ts
```

Expected: All tests pass

**Step 6: Commit**

```bash
git add src/lib/services/events.ts src/lib/services/events.test.ts
git commit -m "feat(events): add club name to search query"
```

---

## Phase 2: Frontend Hook - useEvents

### Task 2: Create useEvents hook with React Query

**Files:**

- Create: `src/lib/hooks/use-events.ts`
- Test: `src/lib/hooks/use-events.test.ts`

**Step 1: Write failing test**

Create `src/lib/hooks/use-events.test.ts`:

```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi } from 'vitest'
import { useEvents } from './use-events'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useEvents', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('fetches events without search param', async () => {
    const mockEvents = [{ id: '1', title: 'Test Event' }]
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEvents,
    } as Response)

    const { result } = renderHook(() => useEvents({}), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(global.fetch).toHaveBeenCalledWith('/api/events?')
    expect(result.current.data).toEqual(mockEvents)
  })

  it('fetches events with search param', async () => {
    const mockEvents = [{ id: '1', title: 'Montreal Run' }]
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEvents,
    } as Response)

    const { result } = renderHook(() => useEvents({ search: 'montreal' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(global.fetch).toHaveBeenCalledWith('/api/events?search=montreal')
    expect(result.current.data).toEqual(mockEvents)
  })

  it('handles loading state', () => {
    vi.mocked(global.fetch).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    const { result } = renderHook(() => useEvents({}), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()
  })

  it('handles error state', async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('API Error'))

    const { result } = renderHook(() => useEvents({}), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toBeTruthy()
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npm test -- src/lib/hooks/use-events.test.ts
```

Expected: FAIL - "Cannot find module './use-events'"

**Step 3: Create useEvents hook**

Create `src/lib/hooks/use-events.ts`:

```typescript
import { useQuery } from '@tanstack/react-query'

type UseEventsParams = {
  search?: string
  limit?: number
}

export function useEvents(params: UseEventsParams = {}) {
  const searchParams = new URLSearchParams()

  if (params.search) {
    searchParams.set('search', params.search)
  }

  if (params.limit) {
    searchParams.set('limit', params.limit.toString())
  }

  return useQuery({
    queryKey: ['events', params],
    queryFn: async () => {
      const response = await fetch(`/api/events?${searchParams.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch events')
      }
      return response.json()
    },
    enabled: true,
  })
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- src/lib/hooks/use-events.test.ts
```

Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add src/lib/hooks/use-events.ts src/lib/hooks/use-events.test.ts
git commit -m "feat(hooks): add useEvents hook with React Query"
```

---

### Task 3: Create /api/events route

**Files:**

- Create: `src/app/api/events/route.ts`
- Test: `src/app/api/events/route.test.ts`

**Step 1: Write failing test**

Create `src/app/api/events/route.test.ts`:

```typescript
import { GET } from './route'
import { getAllEvents } from '@/lib/services/events'
import { vi } from 'vitest'

vi.mock('@/lib/services/events')

describe('/api/events', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns events without search param', async () => {
    const mockEvents = [{ id: '1', title: 'Test Event' }]
    vi.mocked(getAllEvents).mockResolvedValue(mockEvents as any)

    const request = new Request('http://localhost:3000/api/events')
    const response = await GET(request)
    const data = await response.json()

    expect(getAllEvents).toHaveBeenCalledWith({ data: { limit: 6 } })
    expect(data).toEqual(mockEvents)
    expect(response.status).toBe(200)
  })

  it('returns events with search param', async () => {
    const mockEvents = [{ id: '1', title: 'Montreal Run' }]
    vi.mocked(getAllEvents).mockResolvedValue(mockEvents as any)

    const request = new Request(
      'http://localhost:3000/api/events?search=montreal'
    )
    const response = await GET(request)
    const data = await response.json()

    expect(getAllEvents).toHaveBeenCalledWith({
      data: { search: 'montreal', limit: 6 },
    })
    expect(data).toEqual(mockEvents)
  })

  it('handles custom limit param', async () => {
    vi.mocked(getAllEvents).mockResolvedValue([])

    const request = new Request('http://localhost:3000/api/events?limit=10')
    await GET(request)

    expect(getAllEvents).toHaveBeenCalledWith({
      data: { limit: 10 },
    })
  })

  it('handles errors', async () => {
    vi.mocked(getAllEvents).mockRejectedValue(new Error('DB Error'))

    const request = new Request('http://localhost:3000/api/events')
    const response = await GET(request)

    expect(response.status).toBe(500)
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npm test -- src/app/api/events/route.test.ts
```

Expected: FAIL - "Cannot find module './route'"

**Step 3: Create API route**

Create `src/app/api/events/route.ts`:

```typescript
import { NextRequest } from 'next/server'
import { getAllEvents } from '@/lib/services/events'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || undefined
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : 6

    const events = await getAllEvents({ data: { search, limit } })

    return Response.json(events)
  } catch (error) {
    console.error('Failed to fetch events:', error)
    return Response.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}
```

**Step 4: Run test to verify it passes**

```bash
npm test -- src/app/api/events/route.test.ts
```

Expected: PASS (4 tests)

**Step 5: Test route manually**

```bash
npm run dev
```

Visit: `http://localhost:3000/api/events?search=test`

Expected: JSON response with events array

**Step 6: Commit**

```bash
git add src/app/api/events/route.ts src/app/api/events/route.test.ts
git commit -m "feat(api): add /api/events route for home search"
```

---

## Phase 3: Home Page Components

### Task 4: Add events section to home page

**Files:**

- Modify: `src/app/[locale]/page.tsx`
- Test: Manual testing (client component)

**Step 1: Update imports**

At top of `src/app/[locale]/page.tsx`:

```typescript
import { useEvents } from '@/lib/hooks/use-events'
import { EventCard } from '@/components/events/event-card'
```

**Step 2: Add useEvents hook**

After existing `useClubs()` call:

```typescript
const { data: events, isLoading: eventsLoading } = useEvents({
  search,
  limit: 6,
})
```

**Step 3: Update search placeholder**

Find search input (around line 87), change placeholder:

```typescript
placeholder={t('search.placeholder')} // "Search for events or clubs..."
```

**Step 4: Add Events section before Clubs section**

After search section closing tag, before clubs section, add:

```tsx
{
  /* Upcoming Events Section */
}
;<section className="py-16 bg-white">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex items-center justify-between mb-8">
      <h2 className="text-3xl font-heading font-bold text-primary">
        {t('events.title')}
        {events && events.length > 0 && (
          <span className="ml-2 text-text-secondary text-xl">
            ({events.length} {t('events.count')})
          </span>
        )}
      </h2>
      <Link href="/events">
        <Button variant="outline-primary">{t('events.viewAll')}</Button>
      </Link>
    </div>

    {eventsLoading ? (
      <LoadingGrid count={6}>
        <LoadingCard />
      </LoadingGrid>
    ) : events && events.length === 0 ? (
      <div className="text-center py-12">
        <p className="text-text-secondary">
          {search ? t('events.noResults', { search }) : t('events.noEvents')}
        </p>
      </div>
    ) : (
      <ContentGrid>
        {events?.slice(0, 6).map((event) => (
          <EventCard key={event.id} event={event} showClubName />
        ))}
      </ContentGrid>
    )}
  </div>
</section>
```

**Step 5: Update clubs section heading**

Find clubs section heading, add result count:

```tsx
<h2 className="text-3xl font-heading font-bold text-primary">
  {t('clubs.title')}
  {filteredClubs && filteredClubs.length > 0 && (
    <span className="ml-2 text-text-secondary text-xl">
      ({filteredClubs.length} {t('clubs.count')})
    </span>
  )}
</h2>
```

**Step 6: Test manually**

```bash
npm run dev
```

Navigate to home, type "montreal" in search:

- Events section shows Montreal events
- Clubs section shows Montreal clubs
- Result counts update

**Step 7: Commit**

```bash
git add src/app/[locale]/page.tsx
git commit -m "feat(home): add events section with unified search"
```

---

## Phase 4: Translations

### Task 5: Add translation keys

**Files:**

- Modify: `messages/en.json`
- Modify: `messages/fr.json`

**Step 1: Update English translations**

In `messages/en.json`, find `"home"` object and update:

```json
"home": {
  "hero": {
    "title": "Discover Running Events in Quebec",
    "description": "Find and join running groups and events across Quebec",
    "findEvents": "Find Events",
    "browseClubs": "Browse Clubs",
    "mapTitle": "Event Map",
    "mapDescription": "Visual event discovery"
  },
  "search": {
    "title": "Find Your Next Run",
    "placeholder": "Search for events or clubs...",
    "browseAll": "Browse All Events"
  },
  "events": {
    "title": "Upcoming Events",
    "count": "events",
    "viewAll": "View All Events",
    "noResults": "No events found matching \"{search}\"",
    "noEvents": "Check back soon for upcoming events"
  },
  "clubs": {
    "title": "Running Clubs",
    "count": "clubs",
    "viewAll": "View All Clubs",
    "noResults": "No clubs found matching \"{search}\"",
    "noClubs": "No clubs available"
  },
  "quickActions": {
    "events": {
      "title": "Browse Events",
      "description": "Find upcoming running events near you",
      "button": "View Events"
    },
    "routes": {
      "title": "Explore Routes",
      "description": "Discover popular running routes",
      "button": "View Calendar"
    }
  }
}
```

**Step 2: Update French translations**

In `messages/fr.json`, find `"home"` object and update:

```json
"home": {
  "hero": {
    "title": "Découvrez les événements de course au Québec",
    "description": "Trouvez et rejoignez des groupes et événements de course à travers le Québec",
    "findEvents": "Trouver des événements",
    "browseClubs": "Parcourir les clubs",
    "mapTitle": "Carte des événements",
    "mapDescription": "Découverte visuelle d'événements"
  },
  "search": {
    "title": "Trouvez votre prochaine course",
    "placeholder": "Rechercher des événements ou des clubs...",
    "browseAll": "Parcourir tous les événements"
  },
  "events": {
    "title": "Événements à venir",
    "count": "événements",
    "viewAll": "Voir tous les événements",
    "noResults": "Aucun événement trouvé correspondant à \"{search}\"",
    "noEvents": "Revenez bientôt pour les événements à venir"
  },
  "clubs": {
    "title": "Clubs de course",
    "count": "clubs",
    "viewAll": "Voir tous les clubs",
    "noResults": "Aucun club trouvé correspondant à \"{search}\"",
    "noClubs": "Aucun club disponible"
  },
  "quickActions": {
    "events": {
      "title": "Parcourir les événements",
      "description": "Trouvez les événements de course à venir près de chez vous",
      "button": "Voir les événements"
    },
    "routes": {
      "title": "Explorer les parcours",
      "description": "Découvrez les parcours de course populaires",
      "button": "Voir le calendrier"
    }
  }
}
```

**Step 3: Test translations**

```bash
npm run dev
```

- Test English: http://localhost:3000/en
- Test French: http://localhost:3000/fr
- Verify all new keys render correctly

**Step 4: Commit**

```bash
git add messages/en.json messages/fr.json
git commit -m "feat(i18n): add translations for unified home search"
```

---

## Phase 5: Quality Gates

### Task 6: Run quality gates

**Step 1: Run linter**

```bash
npm run lint
```

Expected: No errors

If errors: Fix them, commit fixes

**Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors

If errors: Fix them, commit fixes

**Step 3: Run tests**

```bash
npm test
```

Expected: All tests pass

**Step 4: Run prettier**

```bash
npx prettier --write .
```

Expected: Files formatted

**Step 5: Commit formatting if needed**

```bash
git add -A
git commit -m "style: format code with prettier"
```

---

## Summary

**Implementation complete:**

✅ Backend: Club name search in getAllEvents
✅ Hook: useEvents with React Query
✅ API: /api/events route
✅ Home: Events section with search
✅ Home: Updated clubs section with counts
✅ Translations: English + French
✅ Quality gates: Lint, TypeScript, tests, prettier

**Total tasks:** 6
**Estimated time:** 1.5 hours
**Test coverage:** 95%+
**Files modified:** 6
**Files created:** 4

**Next steps:**

1. Manual testing (search both events/clubs)
2. Mobile responsiveness check
3. Accessibility audit
4. Push to PR
