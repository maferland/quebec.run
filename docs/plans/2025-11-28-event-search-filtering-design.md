# Event Search & Filtering - Design Document

**Status:** Design
**Created:** 2025-11-28
**Feature:** Server-side event search and filtering across public and admin pages

## Overview

Wire up existing search UI and implement comprehensive server-side filtering for events. Search by text (title/location), filter by club, filter by date range. URL-based state for shareability and SEO.

## Goals

- Connect disconnected search UI on home page (src/app/[locale]/page.tsx:59-92)
- Implement designed filtering for admin events (2025-11-25-admin-events-users-design.md:183)
- Add filtering to public events page
- Server-side filtering via searchParams (scalable, SEO-friendly)
- Unified behavior across all pages

## Non-Goals

- Full-text search engine (Postgres full-text or Algolia) - simple LIKE queries sufficient
- Faceted search (counts per filter)
- Saved searches or search history
- Search autocomplete/suggestions

## Architecture

### URL Pattern

```
/events?search=montreal&clubId=abc123&dateFrom=2025-12-01&dateTo=2025-12-31
```

**URL as source of truth:**

- Bookmark/share = same results
- Browser back/forward works correctly
- SEO: filtered views get indexed

### Data Flow

1. User interacts with filters (search input, club dropdown, date picker)
2. Client updates URL searchParams via `useRouter().push()`
3. Server Component re-renders with new searchParams
4. Service layer validates params, builds Prisma `where` clause
5. Filtered results render

### Security Boundary

**Public `getAllEvents()`:**

- Keeps existing `date >= today` check (events.ts:18-23)
- Users see only future/current events
- Filters apply within future events only

**Admin `getAllEventsForAdmin()`:**

- No date restriction (view event history)
- Requires `user.isAdmin` check
- Filters apply to all events (past and future)

**Event model has no private fields** - all data public by nature (title, description, address, date).

## Schema Layer

### New Schema

**File:** `src/lib/schemas.ts`

```typescript
export const eventsQuerySchema = z.object({
  search: z.string().optional(), // matches title OR address (case-insensitive)
  clubId: z.string().cuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  sortBy: z.enum(['date', 'title']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
})

export type EventsQuery = z.infer<typeof eventsQuerySchema>
```

**Validation:** Service layer validates. Invalid params = ignored (fallback to defaults).

## Service Layer

### Extended getAllEvents (Public)

**File:** `src/lib/services/events.ts`

```typescript
export const getAllEvents = async ({ data }: PublicPayload<EventsQuery>) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const where: Prisma.EventWhereInput = {
    date: { gte: today }, // ← SECURITY: only future events
    ...(data.search && {
      OR: [
        { title: { contains: data.search, mode: 'insensitive' } },
        { address: { contains: data.search, mode: 'insensitive' } },
      ],
    }),
    ...(data.clubId && { clubId: data.clubId }),
    ...(data.dateFrom &&
      data.dateTo && {
        date: {
          gte: new Date(data.dateFrom),
          lte: new Date(data.dateTo),
        },
      }),
    ...(data.dateFrom &&
      !data.dateTo && {
        date: { gte: new Date(data.dateFrom) },
      }),
  }

  const orderBy = {
    [data.sortBy ?? 'date']: data.sortOrder ?? 'asc',
  }

  return await prisma.event.findMany({
    where,
    include: { club: { select: { name: true, slug: true } } },
    orderBy,
    take: data.limit ?? 50,
    skip: data.offset ?? 0,
  })
}
```

**Backward compatible:** Existing calls with `data: {}` return unfiltered future events (no breaking changes).

### New getAllEventsForAdmin (Admin)

```typescript
export const getAllEventsForAdmin = async ({
  user,
  data,
}: AuthPayload<EventsQuery>) => {
  if (!user.isAdmin) throw new UnauthorizedError('Admin access required')

  const where: Prisma.EventWhereInput = {
    // NO date >= today check - admins see all history
    ...(data.search && {
      OR: [
        { title: { contains: data.search, mode: 'insensitive' } },
        { address: { contains: data.search, mode: 'insensitive' } },
      ],
    }),
    ...(data.clubId && { clubId: data.clubId }),
  }

  const orderBy = {
    [data.sortBy ?? 'date']: data.sortOrder ?? 'desc', // ← Admin defaults to desc (recent first)
  }

  return await prisma.event.findMany({
    where,
    include: { club: { select: { name: true, slug: true } } },
    orderBy,
  })
}
```

## Component Architecture

### EventFilters (Client Component)

**File:** `src/components/events/event-filters.tsx`

Shared across public events + admin events pages.

**Props:**

```typescript
type EventFiltersProps = {
  clubs: Array<{ id: string; name: string }>
  showDateRange?: boolean // false for admin
}
```

**Behavior:**

- Controlled inputs with local state (smooth typing UX)
- Debounced URL updates (300ms, avoids excessive re-renders)
- Reads initial state from `useSearchParams()` (URL = source of truth)
- Updates URL via `useRouter().push()` on changes

**UI Elements:**

- Search input (placeholder: "Search by title or location")
- Club dropdown (Select component: "All Clubs" + individual clubs)
- Date range picker (conditional via `showDateRange` prop)
- Clear filters button (resets URL to base path)

**Example:**

```typescript
'use client'

export function EventFilters({ clubs, showDateRange = true }: EventFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') ?? '')

  const debouncedSearch = useDebouncedCallback((value: string) => {
    updateUrl({ search: value })
  }, 300)

  const updateUrl = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([key, val]) => {
      val ? params.set(key, val) : params.delete(key)
    })
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex gap-4 mb-6">
      <Input
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          debouncedSearch(e.target.value)
        }}
        placeholder={t('filters.searchPlaceholder')}
      />
      <Select onValueChange={(val) => updateUrl({ clubId: val })}>
        <SelectItem value="">All Clubs</SelectItem>
        {clubs.map((club) => (
          <SelectItem key={club.id} value={club.id}>
            {club.name}
          </SelectItem>
        ))}
      </Select>
      {showDateRange && <DateRangePicker onChange={...} />}
      <Button variant="ghost" onClick={() => router.push('/events')}>
        Clear
      </Button>
    </div>
  )
}
```

## Page Implementations

### 1. Public Events Page (Server Component)

**File:** `src/app/[locale]/events/page.tsx`

**Current:** Fetches all events, no filtering UI.

**Updated:**

```typescript
export default async function EventsPage({
  searchParams,
}: {
  searchParams: { search?: string; clubId?: string; dateFrom?: string; dateTo?: string }
}) {
  const t = await getTranslations('events')
  const clubs = await getAllClubs({ data: {} })
  const events = await getAllEvents({ data: searchParams })

  return (
    <PageContainer>
      <PageTitle>{t('title')}</PageTitle>

      <EventFilters clubs={clubs} showDateRange={true} />

      {events.length === 0 ? (
        <EmptyState
          title={t('empty.noResults')}
          description={t('empty.tryAdjusting')}
        />
      ) : (
        <ContentGrid>
          {events.map((event) => (
            <EventCard key={event.id} event={event} showClubName />
          ))}
        </ContentGrid>
      )}
    </PageContainer>
  )
}
```

### 2. Admin Events Page (Server Component)

**File:** `src/app/[locale]/admin/events/page.tsx`

**Current:** Basic table, no filtering (lines 8-23).

**Updated:**

```typescript
export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: { search?: string; clubId?: string }
}) {
  const t = await getTranslations('admin.events')
  const session = await getServerSession(authOptions)
  const clubs = await getAllClubs({ data: {} })
  const events = await getAllEventsForAdmin({
    user: session.user,
    data: searchParams,
  })

  return (
    <div>
      {/* Header with "Add New Event" button */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary">
            {t('title')}
          </h1>
          <p className="text-text-secondary mt-2">
            Manage all running events on the platform
          </p>
        </div>
        <Link href="/admin/events/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            {t('addNew')}
          </Button>
        </Link>
      </div>

      {/* Filters - no date range for admin */}
      <EventFilters clubs={clubs} showDateRange={false} />

      {/* Events Table */}
      {events.length === 0 ? (
        <EmptyState
          title={t('empty.noEvents')}
          description={t('empty.noEventsDescription')}
        />
      ) : (
        <EventsTable events={events} />
      )}
    </div>
  )
}
```

**EventsTable component** remains unchanged (existing implementation at lines 61-137).

### 3. Home Page (Client Component)

**File:** `src/app/[locale]/page.tsx`

**Current:** Search UI exists (lines 59-92) but completely static.

**Updated (Search Section only):**

```typescript
'use client'

export default function Home() {
  const t = useTranslations('home')
  const router = useRouter()
  const [search, setSearch] = useState('')

  const handleSearch = (e: FormEvent) => {
    e.preventDefault()
    if (search.trim()) {
      router.push(`/events?search=${encodeURIComponent(search.trim())}`)
    } else {
      router.push('/events')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ... existing hero section ... */}

      {/* Search Section - UPDATED */}
      <section className="py-12 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-heading font-bold text-primary text-center mb-8">
              {t('search.title')}
            </h2>
            <form onSubmit={handleSearch} className="bg-gray-50 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-accent"
                    size={20}
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t('search.placeholder')}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary font-body"
                  />
                </div>
                <Button type="submit" variant="secondary">
                  {t('search.searchButton')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* ... rest of page unchanged ... */}
    </div>
  )
}
```

**Behavior:** Home search redirects to `/events?search=...`. Events page handles display/filtering.

**Removed:** "Filters" button (not needed - advanced filtering available on events page).

## Database Performance

### Index Strategy

**Migration:** `prisma/migrations/YYYYMMDDHHMMSS_add_event_search_indexes/migration.sql`

```sql
-- Improve query performance for common filtering patterns
CREATE INDEX "events_date_idx" ON "events"("date");
CREATE INDEX "events_clubId_idx" ON "events"("clubId");
CREATE INDEX "events_title_idx" ON "events"("title");
CREATE INDEX "events_clubId_date_idx" ON "events"("clubId", "date");
```

**Schema update:**

```prisma
model Event {
  // ... existing fields

  @@index([date])
  @@index([clubId])
  @@index([title])
  @@index([clubId, date])
  @@map("events")
}
```

**Performance expectation:**

- 50 events: negligible difference
- 500 events: ~10x faster filtered queries
- 5000+ events: indexes critical for acceptable performance

**Note:** Postgres `LIKE` queries with `%search%` pattern won't use `title` index efficiently. If performance becomes issue, upgrade to full-text search (Postgres `tsvector` or external service).

## Testing Strategy

### Unit Tests

**`event-filters.test.tsx`:**

- Renders with clubs dropdown populated
- Search input updates URL (debounced, not immediate)
- Club selection updates URL immediately
- Date range updates URL
- Clear filters resets URL to base path
- Initial state reads from searchParams (URL = source of truth)
- Accessibility: keyboard navigation, screen reader labels

**`events.test.ts` (service layer):**

- Filter by search: title match (case-insensitive)
- Filter by search: address match (case-insensitive)
- Filter by search: no matches returns empty array
- Filter by clubId
- Filter by date range (dateFrom + dateTo)
- Filter by dateFrom only (open-ended range)
- Combined filters (search + clubId + date)
- Public function excludes past events
- Admin function includes past events
- Invalid params ignored (validation failure = defaults)

**`get-all-events-for-admin.test.ts`:**

- Non-admin user throws UnauthorizedError
- Admin user can access all events
- Filters work same as public version
- Returns past events

### Integration Tests

**`events-page.test.tsx`:**

- Server renders with searchParams
- Displays filtered results matching params
- Shows EmptyState when no matches
- Renders EventFilters with correct clubs

**`admin-events-page.test.tsx`:**

- Requires authentication (redirects if not logged in)
- Requires admin role (403 if non-admin)
- Displays filtered results
- Shows EventFilters without date range

### E2E Tests (Playwright)

**`event-search.e2e.ts`:**

- Home page: type search term → click Search → redirects to /events with query
- Events page: filter by club dropdown → URL updates, results change
- Events page: type in search → debounced URL update, results change
- Events page: select date range → URL updates, results change
- Events page: clear filters → shows all events
- Share filtered URL → same results load on new session
- Admin page: filter events → results update (can see past events)
- Mobile viewport: filters work correctly

**Coverage Target:** 95% per project standards.

## Translations

### Required Keys

**Files:** `messages/en.json` + `messages/fr.json`

```json
{
  "events": {
    "filters": {
      "searchPlaceholder": "Search by title or location",
      "allClubs": "All Clubs",
      "selectClub": "Filter by club",
      "dateRange": "Date range",
      "clearFilters": "Clear filters"
    },
    "empty": {
      "noResults": "No events match your filters",
      "tryAdjusting": "Try adjusting your search or clearing filters to see more events."
    }
  },
  "home": {
    "search": {
      "title": "Find Your Next Run",
      "placeholder": "Where do you want to run?",
      "searchButton": "Search Events"
    }
  },
  "admin": {
    "events": {
      "empty": {
        "noEvents": "No events found",
        "noEventsDescription": "No events match your current filters. Try adjusting your search."
      }
    }
  }
}
```

**Existing keys reused where applicable** (no duplication).

## Error Handling

### Invalid SearchParams

**Schema validation fails:**

- Invalid date format → ignore, no date filtering
- Invalid clubId format → ignore, no club filtering
- Out-of-range limit/offset → clamp to valid range

**Strategy:** Fail gracefully. Don't error, just ignore invalid params and use defaults.

### Empty Results

**Show EmptyState component:**

- "No events match your filters"
- "Try adjusting your search or clearing filters to see more events"
- Clear filters button

**Not an error state** - valid query, no matches.

### Network/DB Errors

**Already handled by service layer:**

- Throws appropriate errors (NotFoundError, UnauthorizedError)
- Next.js error boundary catches and shows error.tsx
- No additional error handling needed

## Implementation Checklist

### Phase 1: Schema & Service Layer

- [ ] Add `eventsQuerySchema` to schemas.ts
- [ ] Extend `getAllEvents()` with filtering logic
- [ ] Create `getAllEventsForAdmin()` function
- [ ] Add Event indexes to Prisma schema
- [ ] Generate migration
- [ ] Run migration (dev + test DB)
- [ ] Service layer unit tests (15+ tests)

### Phase 2: Components

- [ ] Create `EventFilters` component
- [ ] Add debounced search hook (`useDebouncedCallback`)
- [ ] Component unit tests (12+ tests)
- [ ] Storybook stories (various filter states)

### Phase 3: Page Updates

- [ ] Update public events page (add filters, pass searchParams)
- [ ] Update admin events page (add filters, use admin function)
- [ ] Update home page (wire search form)
- [ ] Integration tests (8+ tests)

### Phase 4: Translations & Polish

- [ ] Add translation keys (en + fr)
- [ ] Test empty states
- [ ] Test mobile responsiveness
- [ ] E2E tests (6+ scenarios)

### Phase 5: Quality Gates

- [ ] `npm run lint` (zero errors)
- [ ] `npx tsc --noEmit` (zero errors)
- [ ] `npm run test -- --coverage` (≥95%)
- [ ] `npx prettier --write .` (formatting)
- [ ] Manual testing (all three pages)

## Success Criteria

**Home Page:**

- ✅ Search form submits to /events with query
- ✅ Empty search navigates to /events (no query)
- ✅ Accessible form (keyboard, screen readers)

**Public Events Page:**

- ✅ Filter by search (title/location)
- ✅ Filter by club dropdown
- ✅ Filter by date range
- ✅ Filters combine correctly (AND logic)
- ✅ URL updates reflect filter state
- ✅ Shareable URLs work
- ✅ Empty state when no matches

**Admin Events Page:**

- ✅ Same filtering as public (minus date range)
- ✅ Shows past events (admin privilege)
- ✅ Requires admin role
- ✅ Filters work with existing table

**Performance:**

- ✅ Indexes created
- ✅ Queries fast (<100ms for 500 events)
- ✅ Debounced search prevents excessive requests

**Quality:**

- ✅ 95%+ test coverage
- ✅ Zero TypeScript errors
- ✅ Zero ESLint errors
- ✅ Accessible (WCAG AA)
- ✅ Mobile responsive

## Open Questions

None - design validated.

## References

- Admin Events Design: `docs/plans/2025-11-25-admin-events-users-design.md`
- Existing Service Layer: `src/lib/services/events.ts`
- Prisma Filtering: https://www.prisma.io/docs/concepts/components/prisma-client/filtering-and-sorting
- Next.js searchParams: https://nextjs.org/docs/app/api-reference/file-conventions/page#searchparams-optional
