# Unified Home Search - Design Document

**Status:** Approved
**Created:** 2025-11-29
**Feature:** Home page unified search filtering both events and clubs

## Overview

Replace limited club-name-only search on home page with comprehensive search that filters both upcoming events and running clubs simultaneously. Search across event titles, addresses, club names, providing users with immediate discovery of relevant content.

## Problem Statement

Current home page search only filters clubs by name, but users expect to search for events by location, cafe names, day of week, etc. This creates a UX mismatch - users typing "Montreal" or "Saturday" expect event results, not just clubs.

## Goals

- Single search bar filters both events and clubs sections
- Search events by: title, address, club name
- Search clubs by: name
- Show result counts to clarify filtered state
- Preserve existing navigation CTAs
- No tabs/modes - simple unified experience

## Non-Goals

- Advanced filtering (date range, distance) on home - keep on events page
- Search history or autocomplete
- Fuzzy/typo-tolerant search
- Search results pagination on home (show top 6 of each)

## Architecture

### Layout Structure

```
[Hero Section]
  - Title, description
  - "Find Events" + "Browse Clubs" CTA buttons

[Search Section]
  - Search input: "Search for events or clubs..."
  - "Browse All Events" button (navigates to /events)

[Upcoming Events Section]
  - Heading: "Upcoming Events" + result count "(X events)"
  - Top 6 event cards (filtered by search)
  - Empty state when no matches
  - "View All Events" link

[Running Clubs Section]
  - Heading: "Running Clubs" + result count "(X clubs)"
  - Top 6 club cards (filtered by search, clickable)
  - Empty state when no matches
  - "View All Clubs" link

[Quick Actions Section] (static)
```

### Data Flow

```
User types in search input
  ↓
Search state updates (controlled input)
  ↓
Events: debounced query (300ms) → getAllEvents({ search })
Clubs: instant filter (client-side, clubs already loaded)
  ↓
Both sections re-render with filtered results
```

### Component Structure

**Home page (Client Component):**

```tsx
'use client'

export default function Home() {
  const [search, setSearch] = useState('')
  const { data: events, isLoading: eventsLoading } = useEvents({ search })
  const { data: clubs, isLoading: clubsLoading } = useClubs()

  const filteredClubs = clubs?.filter((club) =>
    club.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <HeroSection />
      <SearchSection search={search} onSearchChange={setSearch} />
      <EventsSection events={events} loading={eventsLoading} search={search} />
      <ClubsSection
        clubs={filteredClubs}
        loading={clubsLoading}
        search={search}
      />
      <QuickActionsSection />
    </>
  )
}
```

**New hook required:**

```tsx
// src/lib/hooks/use-events.ts
export function useEvents(params: { search?: string }) {
  return useQuery({
    queryKey: ['events', params],
    queryFn: () =>
      fetch(`/api/events?${new URLSearchParams(params)}`).then((r) => r.json()),
  })
}
```

## Backend Changes

### Extend getAllEvents Search

**Current search (events.ts:100-105):**

```typescript
OR: [
  { title: { contains: search, mode: 'insensitive' } },
  { address: { contains: search, mode: 'insensitive' } },
]
```

**Add club name search:**

```typescript
OR: [
  { title: { contains: search, mode: 'insensitive' } },
  { address: { contains: search, mode: 'insensitive' } },
  { club: { name: { contains: search, mode: 'insensitive' } } }, // NEW
]
```

**Performance:** Existing indexes on `events.title`, `events.clubId` cover this. Club name search uses foreign key join, should be fast with current dataset size.

### API Route (if needed)

If not using existing /api/events, create:

```typescript
// src/app/api/events/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || undefined

  const events = await getAllEvents({ data: { search, limit: 6 } })
  return Response.json(events)
}
```

## UI Components

### Search Section

**Search input:**

- Placeholder: "Search for events or clubs..."
- Icon: Search (lucide-react)
- Full width on mobile, max-width on desktop
- Debounced for events (300ms), instant for clubs

**Browse button:**

- "Browse All Events"
- Links to /events page
- Secondary variant

### Events Section

**Heading with count:**

```tsx
<h2>Upcoming Events {events?.length > 0 && `(${events.length} events)`}</h2>
```

**Event cards:**

- Reuse existing EventCard component
- Show: title, date, time, club name, address
- Click → /events/[id]

**Empty states:**

- With search: "No events found matching '{search}'"
- No search: "Check back soon for upcoming events"

### Clubs Section

**Heading with count:**

```tsx
<h2>
  Running Clubs {filteredClubs?.length > 0 && `(${filteredClubs.length} clubs)`}
</h2>
```

**Club cards:**

- Reuse existing ClubCard component
- Clickable → /clubs/[slug]
- Show: name, description (if available)

**Empty states:**

- With search: "No clubs found matching '{search}'"
- No search: "No clubs available"

## Search Behavior

### Events Search

**Searches across:**

- Event title (e.g., "Montreal Morning Run")
- Event address (e.g., "835 Av. Wilfrid-Laurier")
- Club name (e.g., "6AM Club")

**Example searches:**

- "Montreal" → matches events in Montreal + events by clubs with "Montreal" in name
- "6AM" → matches "6AM Club" events
- "Wilfrid" → matches events at that address

### Clubs Search

**Searches:**

- Club name only (simple, focused)

**Example searches:**

- "Montreal" → "Montreal Runners"
- "6AM" → "6AM Club"

## Error Handling

### Network Errors

**Events fetch fails:**

- Show previous results (React Query cache)
- Display toast: "Failed to load events"
- Retry button in empty state

**Clubs fetch fails:**

- Show previous results (already fetched on mount)
- Should be rare (clubs loaded once on page load)

### Empty Search Results

**Both sections empty:**

- Show empty states for each section
- "Browse All Events" / "View All Clubs" still available
- Clear search button appears

### Invalid Search Input

No validation needed - all text input is valid. Empty string shows all results (default behavior).

## Performance Considerations

### Debouncing

Events query debounced 300ms to avoid excessive API calls while typing. Clubs filter instant (client-side, <100 items).

### Query Optimization

**Events query limited to 6 results:**

```typescript
const events = await getAllEvents({ data: { search, limit: 6 } })
```

**Clubs already loaded:** No additional query, client-side filter.

### Caching

React Query caches events by search term. Typing "Montreal", clearing, typing "Montreal" again = instant from cache.

## Testing Strategy

### Unit Tests

**Home page:**

- Renders search input
- Filters clubs client-side
- Shows result counts
- Displays empty states

**useEvents hook:**

- Calls API with search param
- Debounces requests
- Handles loading/error states

### Integration Tests

**Search functionality:**

- Type search → events query fires with param
- Type search → clubs filter instantly
- Clear search → shows all results
- Empty results → shows empty states

### E2E Tests (Playwright)

**User journey:**

- Navigate to home
- Type "Montreal" in search
- Verify events section shows Montreal events
- Verify clubs section shows Montreal clubs
- Verify result counts update
- Click event card → navigates to event detail
- Click club card → navigates to club detail

## Translations

### New Keys Required

**English (messages/en.json):**

```json
{
  "home": {
    "search": {
      "placeholder": "Search for events or clubs...",
      "browseAll": "Browse All Events"
    },
    "events": {
      "title": "Upcoming Events",
      "count": "{count} events",
      "noResults": "No events found matching \"{search}\"",
      "noEvents": "Check back soon for upcoming events"
    },
    "clubs": {
      "title": "Running Clubs",
      "count": "{count} clubs",
      "noResults": "No clubs found matching \"{search}\"",
      "noClubs": "No clubs available"
    }
  }
}
```

**French (messages/fr.json):**

```json
{
  "home": {
    "search": {
      "placeholder": "Rechercher des événements ou des clubs...",
      "browseAll": "Parcourir tous les événements"
    },
    "events": {
      "title": "Événements à venir",
      "count": "{count} événements",
      "noResults": "Aucun événement trouvé correspondant à \"{search}\"",
      "noEvents": "Revenez bientôt pour les événements à venir"
    },
    "clubs": {
      "title": "Clubs de course",
      "count": "{count} clubs",
      "noResults": "Aucun club trouvé correspondant à \"{search}\"",
      "noClubs": "Aucun club disponible"
    }
  }
}
```

## Implementation Checklist

### Phase 1: Backend

- [ ] Extend getAllEvents to search club.name
- [ ] Create /api/events route (if needed)
- [ ] Add tests for club name search

### Phase 2: Frontend Hook

- [ ] Create useEvents hook
- [ ] Add debouncing (300ms)
- [ ] Test hook with React Query

### Phase 3: Home Page Components

- [ ] Update search section (new placeholder, Browse button)
- [ ] Add EventsSection component
- [ ] Update ClubsSection with result count
- [ ] Add empty states for both sections

### Phase 4: Translations

- [ ] Add English translations
- [ ] Add French translations

### Phase 5: Testing

- [ ] Unit tests for filtering logic
- [ ] Integration tests for search flow
- [ ] E2E test for user journey

### Phase 6: Polish

- [ ] Verify mobile responsiveness
- [ ] Check loading states
- [ ] Verify empty state UX
- [ ] Accessibility audit (keyboard nav, screen readers)

## Success Criteria

**Functional:**

- ✅ Search filters both events and clubs
- ✅ Events search includes title, address, club name
- ✅ Result counts update dynamically
- ✅ Empty states clear and actionable
- ✅ "Browse All" CTAs always visible

**Performance:**

- ✅ Events query <200ms for typical searches
- ✅ Clubs filter instant (<50ms)
- ✅ Debouncing prevents query spam

**UX:**

- ✅ Clear what's being searched (dual result counts)
- ✅ No jarring redirects
- ✅ Mobile responsive
- ✅ Keyboard accessible

## Open Questions

None - design validated with user.

## References

- Existing search: docs/plans/2025-11-28-event-search-filtering-design.md
- useClubs hook: src/lib/hooks/use-clubs.ts
- EventCard: src/components/events/event-card.tsx
- ClubCard: src/components/clubs/club-card.tsx
