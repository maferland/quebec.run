# Map Markers Feature - Design Document

**Status:** Design
**Created:** 2025-11-28
**Feature:** Interactive event map with automatic geocoding

## Overview

Add interactive Leaflet map showing event locations on homepage and events page. Auto-geocode event addresses server-side using OSM Nominatim (no user input of coordinates required). Events without geocoded addresses excluded from map but visible in lists.

## Goals

- Visual event discovery via interactive map
- Zero manual coordinate entry (auto-geocode from address)
- Handle clustering for dense event areas
- WCAG AA accessible (keyboard nav, screen readers)
- Mobile-first responsive design

## Non-Goals

- Custom map tiles/styling (use default Leaflet tiles)
- Route planning or directions
- Map filtering by date/distance/pace (v2)
- Geocoding for clubs (events only)

## Architecture

### Geocoding Strategy

**Service:** OpenStreetMap Nominatim API

- Free, open, no API keys
- Good coverage for Quebec addresses
- Rate limit: 1 req/sec per usage policy
- Endpoint: `https://nominatim.openstreetmap.org/search?q={address}&format=json&countrycodes=ca&limit=1`

**Flow:**

1. Event create/update → event service calls geocoding service
2. Geocoding service rate-limited queue (1 req/sec)
3. Success → store lat/long in Event.latitude/longitude
4. Failure → log warning, save event without coords
5. Cache geocoded addresses to avoid redundant API calls

**Error Handling:**

- Network errors: 1 retry with 5s timeout
- Failed geocoding: event saved without coords, appears in lists but not map
- Admin sees toast: "Event saved. Address couldn't be mapped automatically"

### Data Model

**Event Schema (existing fields used):**

```prisma
model Event {
  latitude  Float?
  longitude Float?
  address   String?
  // ... existing fields
}
```

**New field (optional, for cache invalidation):**

```prisma
  geocodedAt DateTime?
```

**Migration:**

- Backfill script to geocode existing events with addresses but no coords
- Rate-limited batch processing (will take time for large datasets)

### Service Layer

**New Files:**

```
src/lib/services/geocoding.ts
  - geocodeAddress(address: string): Promise<{lat: number, lng: number} | null>
  - Rate-limited queue implementation
  - Nominatim HTTP client
  - Retry logic, timeout handling
```

**Modified:**

```
src/lib/services/events.ts
  - createEvent: call geocoding service before DB insert
  - updateEvent: re-geocode if address changed
```

### Component Architecture

**Map Component:**

```
src/components/map/event-map.tsx (Client Component)
  - Props: events: Event[], initialCenter?: [lat, lng], initialZoom?: number
  - Dynamic import via next/dynamic (SSR: false) - Leaflet requires window
  - Filters events to only those with lat/long
  - Uses react-leaflet-markercluster for clustering
  - Mobile-responsive: 400px mobile, 600px desktop height
```

**Marker Popup:**

```
src/components/map/event-marker.tsx
  - Semantic HTML (h3 for title)
  - Content: title, date/time, club name (linked), address
  - CTA: "View Details" button → event detail page
  - Keyboard accessible (Enter to open, Esc to close)
```

**Page Integration:**

```
src/app/[locale]/page.tsx
  - Replace placeholder map section (lines 42-54) with EventMap

src/app/[locale]/events/page.tsx
  - Add EventMap above ContentGrid (before event list)
```

**Empty State:**

- Show message if no events have coordinates: "Events will appear on the map once addresses are geocoded"

### Accessibility

- Map: `role="application"`, `aria-label="Interactive event map"`
- Keyboard nav: Tab to markers, Enter to open popup, Esc to close
- Screen reader: Hidden skip link to bypass map, list view always available below
- Ensure popup content readable by screen readers

## Testing Strategy

### Unit Tests

**`geocoding.test.ts`:**

- Mock Nominatim responses (success, failure, timeout)
- Verify rate limiting (queue processes 1 req/sec)
- Test retry logic on network errors
- Test address caching

**`event-map.test.tsx`:**

- Render with events (with/without coords)
- Verify markers rendered for geocoded events
- Verify clustering behavior
- Test empty state (no geocoded events)

**`event-marker.test.tsx`:**

- Popup content (title, date, club link, address)
- Keyboard nav (Enter, Esc)
- Link to event detail page

### Integration Tests

**`events.test.ts`:**

- Event create triggers geocoding, lat/long stored
- Event update re-geocodes if address changed
- Failed geocoding → event saved without coords

### E2E Tests (Playwright)

**`map-markers.spec.ts`:**

- Navigate to homepage → verify map renders
- Click marker → popup opens with event details
- Click "View Details" → navigate to event page
- Test mobile viewport responsiveness

### Storybook Stories

**`event-map.stories.tsx`:**

- Map with 0, 1, 10, 100 events
- Map with clustered markers
- Map with no geocoded events (empty state)

**Coverage Target:** 95% per project standards

## Dependencies

**Existing:**

- `leaflet` (1.9.4)
- `react-leaflet` (5.0.0)
- `@types/leaflet` (1.9.20)

**New:**

```bash
npm install react-leaflet-markercluster leaflet.markercluster
npm install -D @types/leaflet.markercluster
```

**CSS Import Required:**

```typescript
// In EventMap component
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
```

## Migration & Rollout

### Phase 1: Geocoding Service

1. Add `geocodedAt` field to Event model (optional)
2. Create geocoding service with rate limiting
3. Modify event service to call geocoding
4. Deploy + run migration

### Phase 2: Backfill Existing Events

1. Run backfill script for existing events (rate-limited)
2. Monitor logs for failed geocodes

### Phase 3: Map UI

1. Install markercluster dependencies
2. Create EventMap component
3. Add to homepage and events page
4. Deploy

### Monitoring

- Log geocoding failures (address, error, event ID)
- Track % of events with coords (future admin dashboard metric)

## Open Questions

None - design validated.

## References

- [Nominatim Usage Policy](https://operations.osmfoundation.org/policies/nominatim/)
- [React Leaflet Docs](https://react-leaflet.js.org/)
- [Leaflet Marker Cluster](https://github.com/Leaflet/Leaflet.markercluster)
