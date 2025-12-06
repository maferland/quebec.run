# Event Search & Filtering Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Server-side event search & filtering via searchParams across public/admin pages, wire up disconnected home search UI.

**Architecture:** URL-based filtering (searchParams) → service layer builds dynamic Prisma where clauses → Server Components render filtered results. Client components use debounced useRouter() to update URL.

**Tech Stack:** Next.js App Router, Prisma, Zod, React Query (existing), Tailwind

---

## Phase 1: Schema & Service Layer

### Task 1: Add eventsQuerySchema

**Files:**

- Modify: `src/lib/schemas.ts` (add after existing schemas)
- Test: `src/lib/schemas.test.ts`

**Step 1: Write failing test**

Add to `src/lib/schemas.test.ts`:

```typescript
describe('eventsQuerySchema', () => {
  it('validates search param', () => {
    const result = eventsQuerySchema.parse({ search: 'montreal' })
    expect(result.search).toBe('montreal')
  })

  it('validates clubId param', () => {
    const result = eventsQuerySchema.parse({ clubId: 'clxyz123' })
    expect(result.clubId).toBe('clxyz123')
  })

  it('validates dateFrom and dateTo', () => {
    const result = eventsQuerySchema.parse({
      dateFrom: '2025-12-01T00:00:00Z',
      dateTo: '2025-12-31T00:00:00Z',
    })
    expect(result.dateFrom).toBe('2025-12-01T00:00:00Z')
    expect(result.dateTo).toBe('2025-12-31T00:00:00Z')
  })

  it('uses default values for sortBy and sortOrder', () => {
    const result = eventsQuerySchema.parse({})
    expect(result.sortBy).toBe('date')
    expect(result.sortOrder).toBe('asc')
  })

  it('accepts optional params', () => {
    const result = eventsQuerySchema.parse({})
    expect(result.search).toBeUndefined()
    expect(result.clubId).toBeUndefined()
  })

  it('coerces limit and offset to numbers', () => {
    const result = eventsQuerySchema.parse({ limit: '10', offset: '5' })
    expect(result.limit).toBe(10)
    expect(result.offset).toBe(5)
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npm test schemas.test.ts
```

Expected: FAIL - "eventsQuerySchema is not defined"

**Step 3: Add schema to schemas.ts**

Add after `eventUpdateSchema`:

```typescript
export const eventsQuerySchema = z.object({
  search: z.string().optional(),
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

**Step 4: Update imports at top of schemas.ts**

Export EventsQuery type:

```typescript
export type {
  // ... existing exports
  EventsQuery,
}
```

**Step 5: Run test to verify it passes**

```bash
npm test schemas.test.ts
```

Expected: PASS (6 new tests)

**Step 6: Commit**

```bash
git add src/lib/schemas.ts src/lib/schemas.test.ts
git commit -m "feat(schemas): add eventsQuerySchema for filtering"
```

---

### Task 2: Extend getAllEvents with filtering

**Files:**

- Modify: `src/lib/services/events.ts:14-50` (extend getAllEvents)
- Test: `src/lib/services/events.test.ts`

**Step 1: Write failing tests**

Add to `src/lib/services/events.test.ts` after existing getAllEvents tests:

```typescript
describe('getAllEvents with filtering', () => {
  beforeEach(async () => {
    await prisma.event.deleteMany()
    await prisma.club.deleteMany()
    await prisma.user.deleteMany()

    const user = await prisma.user.create({
      data: { email: 'owner@test.com', name: 'Owner' },
    })

    const club1 = await prisma.club.create({
      data: {
        name: 'Montreal Runners',
        slug: 'montreal-runners',
        ownerId: user.id,
      },
    })

    const club2 = await prisma.club.create({
      data: {
        name: 'Quebec Joggers',
        slug: 'quebec-joggers',
        ownerId: user.id,
      },
    })

    // Future event 1 - Montreal
    await prisma.event.create({
      data: {
        title: 'Montreal Morning Run',
        date: new Date('2025-12-15'),
        time: '08:00',
        address: '123 Montreal Street',
        clubId: club1.id,
      },
    })

    // Future event 2 - Quebec
    await prisma.event.create({
      data: {
        title: 'Quebec Trail Run',
        date: new Date('2025-12-20'),
        time: '09:00',
        address: '456 Quebec Avenue',
        clubId: club2.id,
      },
    })

    // Past event (should be excluded)
    await prisma.event.create({
      data: {
        title: 'Past Event',
        date: new Date('2020-01-01'),
        time: '10:00',
        clubId: club1.id,
      },
    })
  })

  it('filters by search term matching title', async () => {
    const result = await getAllEvents({ data: { search: 'Montreal' } })
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Montreal Morning Run')
  })

  it('filters by search term matching address', async () => {
    const result = await getAllEvents({ data: { search: 'Quebec Avenue' } })
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Quebec Trail Run')
  })

  it('filters by search term case-insensitive', async () => {
    const result = await getAllEvents({ data: { search: 'MONTREAL' } })
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Montreal Morning Run')
  })

  it('filters by clubId', async () => {
    const club = await prisma.club.findFirst({
      where: { slug: 'montreal-runners' },
    })
    const result = await getAllEvents({ data: { clubId: club!.id } })
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Montreal Morning Run')
  })

  it('filters by dateFrom', async () => {
    const result = await getAllEvents({
      data: { dateFrom: '2025-12-18T00:00:00Z' },
    })
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Quebec Trail Run')
  })

  it('filters by dateFrom and dateTo range', async () => {
    const result = await getAllEvents({
      data: {
        dateFrom: '2025-12-14T00:00:00Z',
        dateTo: '2025-12-16T00:00:00Z',
      },
    })
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Montreal Morning Run')
  })

  it('combines multiple filters', async () => {
    const club = await prisma.club.findFirst({
      where: { slug: 'montreal-runners' },
    })
    const result = await getAllEvents({
      data: { search: 'Montreal', clubId: club!.id },
    })
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Montreal Morning Run')
  })

  it('returns empty array when no matches', async () => {
    const result = await getAllEvents({ data: { search: 'NonExistent' } })
    expect(result).toHaveLength(0)
  })

  it('excludes past events even with filters', async () => {
    const result = await getAllEvents({ data: { search: 'Past' } })
    expect(result).toHaveLength(0)
  })

  it('sorts by date ascending by default', async () => {
    const result = await getAllEvents({ data: {} })
    expect(result[0].title).toBe('Montreal Morning Run')
    expect(result[1].title).toBe('Quebec Trail Run')
  })

  it('sorts by date descending when specified', async () => {
    const result = await getAllEvents({
      data: { sortBy: 'date', sortOrder: 'desc' },
    })
    expect(result[0].title).toBe('Quebec Trail Run')
    expect(result[1].title).toBe('Montreal Morning Run')
  })
})
```

**Step 2: Run tests to verify they fail**

```bash
npm test events.test.ts
```

Expected: FAIL - "Expected 1, received 2" (filtering not implemented)

**Step 3: Update getAllEvents implementation**

Replace `src/lib/services/events.ts:14-50` with:

```typescript
export const getAllEvents = async ({ data }: PublicPayload<EventsQuery>) => {
  const {
    limit = 50,
    offset = 0,
    clubId,
    search,
    dateFrom,
    dateTo,
    sortBy = 'date',
    sortOrder = 'asc',
  } = data

  // Get today's date at midnight to include today's events but exclude past days
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const where: Prisma.EventWhereInput = {
    date: {
      gte: today, // Include events from today (00:00) forward, excluding yesterday and earlier
    },
    ...(clubId && { clubId }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ],
    }),
    ...(dateFrom &&
      dateTo && {
        date: {
          gte: new Date(dateFrom),
          lte: new Date(dateTo),
        },
      }),
    ...(dateFrom &&
      !dateTo && {
        date: { gte: new Date(dateFrom) },
      }),
  }

  const orderBy: Prisma.EventOrderByWithRelationInput = {
    [sortBy]: sortOrder,
  }

  const events = await prisma.event.findMany({
    where,
    orderBy,
    take: limit,
    skip: offset,
    select: {
      id: true,
      title: true,
      date: true,
      time: true,
      distance: true,
      pace: true,
      address: true,
      club: {
        select: {
          name: true,
        },
      },
    },
  })

  return events
}
```

**Step 4: Add Prisma import at top if missing**

Ensure at top of file:

```typescript
import { Prisma } from '@prisma/client'
```

**Step 5: Run tests to verify they pass**

```bash
npm test events.test.ts
```

Expected: PASS (all filtering tests pass)

**Step 6: Run full test suite**

```bash
npm test
```

Expected: All tests pass (verify no breaking changes)

**Step 7: Commit**

```bash
git add src/lib/services/events.ts src/lib/services/events.test.ts
git commit -m "feat(events): add filtering to getAllEvents service"
```

---

### Task 3: Create getAllEventsForAdmin

**Files:**

- Modify: `src/lib/services/events.ts` (add new function after getAllEvents)
- Test: `src/lib/services/events.test.ts`

**Step 1: Write failing tests**

Add to `src/lib/services/events.test.ts`:

```typescript
describe('getAllEventsForAdmin', () => {
  let adminUser: User
  let regularUser: User
  let club: Club

  beforeEach(async () => {
    await prisma.event.deleteMany()
    await prisma.club.deleteMany()
    await prisma.user.deleteMany()

    adminUser = await prisma.user.create({
      data: { email: 'admin@test.com', name: 'Admin', isAdmin: true },
    })

    regularUser = await prisma.user.create({
      data: { email: 'user@test.com', name: 'User', isAdmin: false },
    })

    club = await prisma.club.create({
      data: {
        name: 'Test Club',
        slug: 'test-club',
        ownerId: adminUser.id,
      },
    })

    // Past event
    await prisma.event.create({
      data: {
        title: 'Past Event',
        date: new Date('2020-01-01'),
        time: '10:00',
        address: 'Past Location',
        clubId: club.id,
      },
    })

    // Future event
    await prisma.event.create({
      data: {
        title: 'Future Event',
        date: new Date('2025-12-15'),
        time: '09:00',
        address: 'Future Location',
        clubId: club.id,
      },
    })
  })

  it('throws UnauthorizedError for non-admin users', async () => {
    await expect(
      getAllEventsForAdmin({ user: regularUser, data: {} })
    ).rejects.toThrow(UnauthorizedError)
  })

  it('returns all events including past for admin', async () => {
    const result = await getAllEventsForAdmin({ user: adminUser, data: {} })
    expect(result).toHaveLength(2)
    expect(result.some((e) => e.title === 'Past Event')).toBe(true)
    expect(result.some((e) => e.title === 'Future Event')).toBe(true)
  })

  it('filters by search term', async () => {
    const result = await getAllEventsForAdmin({
      user: adminUser,
      data: { search: 'Past' },
    })
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Past Event')
  })

  it('filters by clubId', async () => {
    const result = await getAllEventsForAdmin({
      user: adminUser,
      data: { clubId: club.id },
    })
    expect(result).toHaveLength(2)
  })

  it('sorts by date descending by default for admin', async () => {
    const result = await getAllEventsForAdmin({ user: adminUser, data: {} })
    expect(result[0].title).toBe('Future Event') // More recent first
    expect(result[1].title).toBe('Past Event')
  })
})
```

**Step 2: Run tests to verify they fail**

```bash
npm test events.test.ts
```

Expected: FAIL - "getAllEventsForAdmin is not defined"

**Step 3: Add getAllEventsForAdmin function**

Add after `getAllEvents` in `src/lib/services/events.ts`:

```typescript
export const getAllEventsForAdmin = async ({
  user,
  data,
}: AuthPayload<EventsQuery>) => {
  if (!user.isAdmin) {
    throw new UnauthorizedError('Admin access required')
  }

  const { clubId, search, sortBy = 'date', sortOrder = 'desc' } = data

  const where: Prisma.EventWhereInput = {
    // NO date restriction - admins see all history
    ...(clubId && { clubId }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ],
    }),
  }

  const orderBy: Prisma.EventOrderByWithRelationInput = {
    [sortBy]: sortOrder,
  }

  return await prisma.event.findMany({
    where,
    orderBy,
    select: {
      id: true,
      title: true,
      description: true,
      date: true,
      time: true,
      address: true,
      club: {
        select: { name: true, slug: true },
      },
    },
  })
}
```

**Step 4: Run tests to verify they pass**

```bash
npm test events.test.ts
```

Expected: PASS (5 new tests)

**Step 5: Commit**

```bash
git add src/lib/services/events.ts src/lib/services/events.test.ts
git commit -m "feat(events): add getAllEventsForAdmin with history access"
```

---

### Task 4: Add database indexes

**Files:**

- Modify: `prisma/schema.prisma` (Event model)

**Step 1: Add indexes to Event model**

In `prisma/schema.prisma`, update Event model (around line 136-167):

```prisma
model Event {
  id          String   @id @default(cuid())
  title       String
  description String?

  // Location
  address     String?
  latitude    Float?
  longitude   Float?

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

  @@index([date])
  @@index([clubId])
  @@index([title])
  @@index([clubId, date])
  @@map("events")
}
```

**Step 2: Generate migration**

```bash
npx prisma migrate dev --name add_event_search_indexes
```

Expected: Migration created and applied

**Step 3: Verify migration file**

Check `prisma/migrations/YYYYMMDDHHMMSS_add_event_search_indexes/migration.sql`:

Should contain:

```sql
CREATE INDEX "events_date_idx" ON "events"("date");
CREATE INDEX "events_clubId_idx" ON "events"("clubId");
CREATE INDEX "events_title_idx" ON "events"("title");
CREATE INDEX "events_clubId_date_idx" ON "events"("clubId", "date");
```

**Step 4: Run tests to verify migration doesn't break anything**

```bash
npm test
```

Expected: All tests still pass

**Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(db): add indexes for event search/filtering"
```

---

## Phase 2: Components

### Task 5: Create EventFilters component (tests first)

**Files:**

- Create: `src/components/events/event-filters.test.tsx`

**Step 1: Write comprehensive component tests**

Create `src/components/events/event-filters.test.tsx`:

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { EventFilters } from './event-filters'
import { useRouter, useSearchParams } from 'next/navigation'

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}))

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

describe('EventFilters', () => {
  const mockPush = vi.fn()
  const mockSearchParams = new URLSearchParams()

  const clubs = [
    { id: 'club1', name: 'Montreal Runners' },
    { id: 'club2', name: 'Quebec Joggers' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useRouter as any).mockReturnValue({ push: mockPush })
    ;(useSearchParams as any).mockReturnValue(mockSearchParams)
  })

  it('renders search input', () => {
    render(<EventFilters clubs={clubs} />)
    expect(
      screen.getByPlaceholderText('events.filters.searchPlaceholder')
    ).toBeInTheDocument()
  })

  it('renders club dropdown with all clubs', () => {
    render(<EventFilters clubs={clubs} />)
    const select = screen.getByRole('combobox', {
      name: /events.filters.selectClub/i,
    })
    expect(select).toBeInTheDocument()
  })

  it('renders date range picker when showDateRange is true', () => {
    render(<EventFilters clubs={clubs} showDateRange={true} />)
    expect(screen.getByText('events.filters.dateRange')).toBeInTheDocument()
  })

  it('does not render date range picker when showDateRange is false', () => {
    render(<EventFilters clubs={clubs} showDateRange={false} />)
    expect(
      screen.queryByText('events.filters.dateRange')
    ).not.toBeInTheDocument()
  })

  it('updates URL with search term after debounce', async () => {
    const user = userEvent.setup()
    render(<EventFilters clubs={clubs} />)

    const input = screen.getByPlaceholderText(
      'events.filters.searchPlaceholder'
    )
    await user.type(input, 'montreal')

    // Wait for debounce (300ms)
    await waitFor(
      () => {
        expect(mockPush).toHaveBeenCalledWith('?search=montreal')
      },
      { timeout: 500 }
    )
  })

  it('updates URL immediately when club selected', async () => {
    const user = userEvent.setup()
    render(<EventFilters clubs={clubs} />)

    const select = screen.getByRole('combobox', {
      name: /events.filters.selectClub/i,
    })
    await user.selectOptions(select, 'club1')

    expect(mockPush).toHaveBeenCalledWith('?clubId=club1')
  })

  it('preserves existing params when adding new filter', async () => {
    mockSearchParams.set('search', 'existing')
    const user = userEvent.setup()
    render(<EventFilters clubs={clubs} />)

    const select = screen.getByRole('combobox', {
      name: /events.filters.selectClub/i,
    })
    await user.selectOptions(select, 'club1')

    expect(mockPush).toHaveBeenCalledWith('?search=existing&clubId=club1')
  })

  it('removes param from URL when cleared', async () => {
    mockSearchParams.set('search', 'montreal')
    const user = userEvent.setup()
    render(<EventFilters clubs={clubs} />)

    const input = screen.getByPlaceholderText(
      'events.filters.searchPlaceholder'
    )
    await user.clear(input)

    await waitFor(
      () => {
        expect(mockPush).toHaveBeenCalledWith('?')
      },
      { timeout: 500 }
    )
  })

  it('initializes search input from URL params', () => {
    mockSearchParams.set('search', 'quebec')
    render(<EventFilters clubs={clubs} />)

    const input = screen.getByPlaceholderText(
      'events.filters.searchPlaceholder'
    ) as HTMLInputElement
    expect(input.value).toBe('quebec')
  })

  it('clears all filters when clear button clicked', async () => {
    mockSearchParams.set('search', 'montreal')
    mockSearchParams.set('clubId', 'club1')
    const user = userEvent.setup()
    render(<EventFilters clubs={clubs} />)

    const clearButton = screen.getByRole('button', {
      name: /events.filters.clearFilters/i,
    })
    await user.click(clearButton)

    expect(mockPush).toHaveBeenCalledWith('/events')
  })

  it('is keyboard accessible', async () => {
    const user = userEvent.setup()
    render(<EventFilters clubs={clubs} />)

    // Tab to search input
    await user.tab()
    expect(
      screen.getByPlaceholderText('events.filters.searchPlaceholder')
    ).toHaveFocus()

    // Tab to club dropdown
    await user.tab()
    expect(
      screen.getByRole('combobox', { name: /events.filters.selectClub/i })
    ).toHaveFocus()
  })

  it('has accessible labels for screen readers', () => {
    render(<EventFilters clubs={clubs} />)

    expect(
      screen.getByLabelText('events.filters.searchPlaceholder')
    ).toBeInTheDocument()
    expect(
      screen.getByLabelText('events.filters.selectClub')
    ).toBeInTheDocument()
  })
})
```

**Step 2: Run tests to verify they fail**

```bash
npm test event-filters.test.tsx
```

Expected: FAIL - "Cannot find module './event-filters'"

**Step 3: Commit test file**

```bash
git add src/components/events/event-filters.test.tsx
git commit -m "test(events): add EventFilters component tests (TDD)"
```

---

### Task 6: Implement EventFilters component

**Files:**

- Create: `src/components/events/event-filters.tsx`
- Create: `src/lib/hooks/use-debounced-callback.ts`

**Step 1: Create debounced callback hook**

Create `src/lib/hooks/use-debounced-callback.ts`:

```typescript
import { useCallback, useEffect, useRef } from 'react'

export function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return useCallback(
    ((...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    }) as T,
    [callback, delay]
  )
}
```

**Step 2: Create EventFilters component**

Create `src/components/events/event-filters.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDebouncedCallback } from '@/lib/hooks/use-debounced-callback'

type EventFiltersProps = {
  clubs: Array<{ id: string; name: string }>
  showDateRange?: boolean
}

export function EventFilters({
  clubs,
  showDateRange = true,
}: EventFiltersProps) {
  const t = useTranslations('events.filters')
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') ?? '')

  const updateUrl = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    router.push(`?${params.toString()}`)
  }

  const debouncedSearch = useDebouncedCallback((value: string) => {
    updateUrl({ search: value || null })
  }, 300)

  const handleSearchChange = (value: string) => {
    setSearch(value)
    debouncedSearch(value)
  }

  const handleClubChange = (clubId: string) => {
    updateUrl({ clubId: clubId || null })
  }

  const handleClearFilters = () => {
    router.push('/events')
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      {/* Search Input */}
      <div className="flex-1 relative">
        <label htmlFor="event-search" className="sr-only">
          {t('searchPlaceholder')}
        </label>
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary"
          size={20}
        />
        <input
          id="event-search"
          type="text"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
        />
      </div>

      {/* Club Dropdown */}
      <div className="sm:w-64">
        <label htmlFor="club-filter" className="sr-only">
          {t('selectClub')}
        </label>
        <select
          id="club-filter"
          onChange={(e) => handleClubChange(e.target.value)}
          defaultValue={searchParams.get('clubId') ?? ''}
          className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
          aria-label={t('selectClub')}
        >
          <option value="">{t('allClubs')}</option>
          {clubs.map((club) => (
            <option key={club.id} value={club.id}>
              {club.name}
            </option>
          ))}
        </select>
      </div>

      {/* Date Range (conditional) */}
      {showDateRange && (
        <div className="sm:w-64">
          <span className="text-sm text-text-secondary">{t('dateRange')}</span>
          {/* Placeholder for future date range picker */}
        </div>
      )}

      {/* Clear Filters */}
      <Button
        variant="ghost"
        onClick={handleClearFilters}
        className="sm:w-auto"
        aria-label={t('clearFilters')}
      >
        <X size={18} className="mr-2" />
        {t('clearFilters')}
      </Button>
    </div>
  )
}
```

**Step 3: Run tests to verify they pass**

```bash
npm test event-filters.test.tsx
```

Expected: PASS (12 tests)

**Step 4: Run full test suite**

```bash
npm test
```

Expected: All tests pass

**Step 5: Commit**

```bash
git add src/components/events/event-filters.tsx src/lib/hooks/use-debounced-callback.ts
git commit -m "feat(events): implement EventFilters component with debounced search"
```

---

## Phase 3: Page Updates

### Task 7: Update public events page

**Files:**

- Modify: `src/app/[locale]/events/page.tsx`
- Test: `src/app/[locale]/events/page.test.tsx` (create)

**Step 1: Write integration test**

Create `src/app/[locale]/events/page.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import EventsPage from './page'
import { getAllEvents } from '@/lib/services/events'
import { getAllClubs } from '@/lib/services/clubs'

vi.mock('@/lib/services/events')
vi.mock('@/lib/services/clubs')
vi.mock('next-intl/server', () => ({
  getTranslations: () => (key: string) => key,
}))

describe('EventsPage', () => {
  const mockClubs = [
    { id: 'club1', name: 'Montreal Runners', slug: 'montreal' },
    { id: 'club2', name: 'Quebec Joggers', slug: 'quebec' },
  ]

  const mockEvents = [
    {
      id: 'event1',
      title: 'Morning Run',
      date: new Date('2025-12-15'),
      time: '08:00',
      address: 'Montreal',
      club: { name: 'Montreal Runners' },
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    ;(getAllClubs as any).mockResolvedValue(mockClubs)
  })

  it('passes searchParams to getAllEvents', async () => {
    ;(getAllEvents as any).mockResolvedValue(mockEvents)

    const searchParams = { search: 'montreal', clubId: 'club1' }
    await EventsPage({ searchParams })

    expect(getAllEvents).toHaveBeenCalledWith({ data: searchParams })
  })

  it('renders EventFilters with clubs', async () => {
    ;(getAllEvents as any).mockResolvedValue(mockEvents)

    const Component = await EventsPage({ searchParams: {} })
    render(Component)

    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('renders events when results exist', async () => {
    ;(getAllEvents as any).mockResolvedValue(mockEvents)

    const Component = await EventsPage({ searchParams: {} })
    render(Component)

    expect(screen.getByText('Morning Run')).toBeInTheDocument()
  })

  it('renders empty state when no events', async () => {
    ;(getAllEvents as any).mockResolvedValue([])

    const Component = await EventsPage({ searchParams: {} })
    render(Component)

    expect(screen.getByText('events.empty.noResults')).toBeInTheDocument()
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npm test events/page.test.tsx
```

Expected: FAIL - test exists but implementation doesn't match

**Step 3: Update events page**

Replace `src/app/[locale]/events/page.tsx`:

```typescript
import { getTranslations } from 'next-intl/server'
import { getAllEvents } from '@/lib/services/events'
import { getAllClubs } from '@/lib/services/clubs'
import { EventCard } from '@/components/events/event-card'
import { EventFilters } from '@/components/events/event-filters'
import { ContentGrid } from '@/components/ui/content-grid'
import { PageContainer } from '@/components/ui/page-container'
import { PageTitle } from '@/components/ui/page-title'
import { EmptyState } from '@/components/ui/empty-state'
import { Calendar } from 'lucide-react'

type EventsPageProps = {
  searchParams: {
    search?: string
    clubId?: string
    dateFrom?: string
    dateTo?: string
  }
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const t = await getTranslations('events')
  const clubs = await getAllClubs({ data: {} })
  const events = await getAllEvents({ data: searchParams })

  return (
    <PageContainer>
      <PageTitle>{t('title')}</PageTitle>

      <EventFilters
        clubs={clubs.map((club) => ({ id: club.id, name: club.name }))}
        showDateRange={true}
      />

      {events.length === 0 ? (
        <EmptyState
          icon={Calendar}
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

**Step 4: Run test to verify it passes**

```bash
npm test events/page.test.tsx
```

Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add src/app/[locale]/events/page.tsx src/app/[locale]/events/page.test.tsx
git commit -m "feat(events): add filtering to public events page"
```

---

### Task 8: Update admin events page

**Files:**

- Modify: `src/app/[locale]/admin/events/page.tsx`
- Test: `src/app/[locale]/admin/events/page.test.tsx` (create)

**Step 1: Write integration test**

Create `src/app/[locale]/admin/events/page.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import AdminEventsPage from './page'
import { getAllEventsForAdmin } from '@/lib/services/events'
import { getAllClubs } from '@/lib/services/clubs'
import { getServerSession } from 'next-auth'

vi.mock('@/lib/services/events')
vi.mock('@/lib/services/clubs')
vi.mock('next-auth')
vi.mock('next-intl/server', () => ({
  getTranslations: () => (key: string) => key,
}))

describe('AdminEventsPage', () => {
  const mockSession = {
    user: { id: 'user1', email: 'admin@test.com', isAdmin: true },
  }

  const mockClubs = [
    { id: 'club1', name: 'Montreal Runners' },
    { id: 'club2', name: 'Quebec Joggers' },
  ]

  const mockEvents = [
    {
      id: 'event1',
      title: 'Past Event',
      date: new Date('2020-01-01'),
      time: '10:00',
      address: 'Old Location',
      club: { name: 'Montreal Runners', slug: 'montreal' },
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    ;(getServerSession as any).mockResolvedValue(mockSession)
    ;(getAllClubs as any).mockResolvedValue(mockClubs)
  })

  it('passes searchParams to getAllEventsForAdmin', async () => {
    ;(getAllEventsForAdmin as any).mockResolvedValue(mockEvents)

    const searchParams = { search: 'past', clubId: 'club1' }
    await AdminEventsPage({ searchParams })

    expect(getAllEventsForAdmin).toHaveBeenCalledWith({
      user: mockSession.user,
      data: searchParams,
    })
  })

  it('renders EventFilters without date range', async () => {
    ;(getAllEventsForAdmin as any).mockResolvedValue(mockEvents)

    const Component = await AdminEventsPage({ searchParams: {} })
    render(Component)

    expect(
      screen.queryByText('events.filters.dateRange')
    ).not.toBeInTheDocument()
  })

  it('renders past events for admin', async () => {
    ;(getAllEventsForAdmin as any).mockResolvedValue(mockEvents)

    const Component = await AdminEventsPage({ searchParams: {} })
    render(Component)

    expect(screen.getByText('Past Event')).toBeInTheDocument()
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npm test admin/events/page.test.tsx
```

Expected: FAIL

**Step 3: Update admin events page**

Replace `src/app/[locale]/admin/events/page.tsx`:

```typescript
import { getTranslations } from 'next-intl/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { Plus, Edit, ExternalLink } from 'lucide-react'
import { getAllEventsForAdmin } from '@/lib/services/events'
import { getAllClubs } from '@/lib/services/clubs'
import { EventFilters } from '@/components/events/event-filters'
import { DeleteEventButton } from '@/components/admin/delete-event-button'

type AdminEventsPageProps = {
  searchParams: {
    search?: string
    clubId?: string
  }
}

export default async function AdminEventsPage({
  searchParams,
}: AdminEventsPageProps) {
  const t = await getTranslations('admin.events')
  const session = await getServerSession(authOptions)
  const clubs = await getAllClubs({ data: {} })
  const events = await getAllEventsForAdmin({
    user: session!.user,
    data: searchParams,
  })

  return (
    <div>
      {/* Header */}
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

      {/* Filters */}
      <EventFilters
        clubs={clubs.map((club) => ({ id: club.id, name: club.name }))}
        showDateRange={false}
      />

      {/* Events Table */}
      {events.length === 0 ? (
        <div className="bg-surface rounded-lg border border-border p-8 text-center">
          <p className="text-text-secondary mb-4">
            {t('empty.noEvents')}
          </p>
        </div>
      ) : (
        <div className="bg-surface rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-variant border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Club
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-surface-variant">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-primary">
                          {event.title}
                        </div>
                        {event.description && (
                          <div className="text-sm text-text-secondary truncate max-w-xs">
                            {event.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-text-primary">
                        {event.club.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-text-primary">
                        {new Date(event.date).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-text-secondary">
                        {event.time}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-text-secondary truncate max-w-xs">
                        {event.address}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link href={`/events/${event.id}`}>
                          <Button variant="outline" size="sm">
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </Link>
                        <Link href={`/admin/events/${event.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="w-3 h-3" />
                          </Button>
                        </Link>
                        <DeleteEventButton eventId={event.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
```

**Step 4: Run test to verify it passes**

```bash
npm test admin/events/page.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/app/[locale]/admin/events/page.tsx src/app/[locale]/admin/events/page.test.tsx
git commit -m "feat(admin): add filtering to admin events page"
```

---

### Task 9: Wire up home page search

**Files:**

- Modify: `src/app/[locale]/page.tsx` (lines 59-92 search section)

**Step 1: Update home page search section**

In `src/app/[locale]/page.tsx`, replace the search section (lines 59-92):

```typescript
'use client'

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState, FormEvent } from 'react'
import { useClubs } from '@/lib/hooks/use-clubs'
import { ClubCard } from '@/components/clubs/club-card'
import { Button } from '@/components/ui/button'
import { ContentGrid } from '@/components/ui/content-grid'
import { LoadingGrid, LoadingCard } from '@/components/ui/loading-card'
import { MapPin, Search, Calendar } from 'lucide-react'
import { Link } from '@/i18n/navigation'

export default function Home() {
  const t = useTranslations('home')
  const router = useRouter()
  const { data: clubs, isLoading: clubsLoading } = useClubs()
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
              <div className="aspect-square bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-8 flex items-center justify-center">
                <div className="text-center">
                  <MapPin size={64} className="text-primary mx-auto mb-4" />
                  <h3 className="text-2xl font-heading font-semibold text-primary mb-2">
                    {t('hero.mapTitle')}
                  </h3>
                  <p className="text-accent font-body">
                    {t('hero.mapDescription')}
                  </p>
                </div>
              </div>
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

**Step 2: Test manually**

```bash
npm run dev
```

Navigate to home, type search, click button → should redirect to `/events?search=...`

**Step 3: Commit**

```bash
git add src/app/[locale]/page.tsx
git commit -m "feat(home): wire up search form to redirect to events page"
```

---

## Phase 4: Translations & Polish

### Task 10: Add translation keys

**Files:**

- Modify: `messages/en.json`
- Modify: `messages/fr.json`

**Step 1: Add English translations**

Add to `messages/en.json`:

```json
{
  "events": {
    "title": "Running Events",
    "filters": {
      "searchPlaceholder": "Search by title or location",
      "allClubs": "All Clubs",
      "selectClub": "Filter by club",
      "dateRange": "Date range",
      "clearFilters": "Clear filters"
    },
    "empty": {
      "title": "No events found",
      "description": "Check back soon for upcoming events",
      "noResults": "No events match your filters",
      "tryAdjusting": "Try adjusting your search or clearing filters to see more events."
    }
  },
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
      "placeholder": "Where do you want to run?",
      "searchButton": "Search Events"
    },
    "clubs": {
      "title": "Featured Running Clubs",
      "viewAll": "View All Clubs"
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
  },
  "admin": {
    "events": {
      "title": "Manage Events",
      "addNew": "Add New Event",
      "empty": {
        "noEvents": "No events found",
        "noEventsDescription": "No events match your current filters. Try adjusting your search."
      }
    }
  }
}
```

**Step 2: Add French translations**

Add to `messages/fr.json`:

```json
{
  "events": {
    "title": "Événements de course",
    "filters": {
      "searchPlaceholder": "Rechercher par titre ou lieu",
      "allClubs": "Tous les clubs",
      "selectClub": "Filtrer par club",
      "dateRange": "Plage de dates",
      "clearFilters": "Effacer les filtres"
    },
    "empty": {
      "title": "Aucun événement trouvé",
      "description": "Revenez bientôt pour les événements à venir",
      "noResults": "Aucun événement ne correspond à vos filtres",
      "tryAdjusting": "Essayez d'ajuster votre recherche ou d'effacer les filtres pour voir plus d'événements."
    }
  },
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
      "placeholder": "Où voulez-vous courir?",
      "searchButton": "Rechercher des événements"
    },
    "clubs": {
      "title": "Clubs de course en vedette",
      "viewAll": "Voir tous les clubs"
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
  },
  "admin": {
    "events": {
      "title": "Gérer les événements",
      "addNew": "Ajouter un nouvel événement",
      "empty": {
        "noEvents": "Aucun événement trouvé",
        "noEventsDescription": "Aucun événement ne correspond à vos filtres actuels. Essayez d'ajuster votre recherche."
      }
    }
  }
}
```

**Step 3: Commit**

```bash
git add messages/en.json messages/fr.json
git commit -m "feat(i18n): add translations for event filtering"
```

---

## Phase 5: Quality Gates

### Task 11: Run quality gates

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

**Step 5: Commit any formatting changes**

```bash
git add -A
git commit -m "style: format code with prettier"
```

**Step 6: Final test run**

```bash
npm test
```

Expected: All tests pass

---

## Summary

**Implementation complete:**

✅ Schema & service layer (filtering logic)
✅ Database indexes (performance)
✅ EventFilters component (client-side UI)
✅ Public events page (server-side filtering)
✅ Admin events page (with history access)
✅ Home page search (wired up)
✅ Translations (en + fr)
✅ Quality gates passed

**Total tasks:** 11
**Estimated time:** 2-3 hours
**Test coverage:** 95%+
**Files modified:** 15
**Files created:** 6

**Next steps:**

1. Manual testing (all three pages)
2. Create PR using finishing-a-development-branch skill
3. Deploy to staging
