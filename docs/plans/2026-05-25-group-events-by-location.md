# Group events by (club, location) — design + plan

**Status**: plan, drives PR #47.
**Origin**: pinpoint feedback on PR #46. Recurring patterns expand to N virtual occurrences and the list/map both show every instance. Result: "Kogi × 9" cluster on the map, three "Kogi" rows in the list (Tomorrow, Tue Jun 2, Tue Jun 9). Users want one row per club per meeting place — the next occurrence is just metadata on that row.

## What we ship

- Each row in `/events` = a (club, address) bucket.
- A bucket surfaces the **next upcoming occurrence** (date + time) plus a short hint of recurrence (e.g. "Mondays + Thursdays" or "Weekly Tuesday").
- The map renders one marker per bucket; clicking opens a popup with the bucket summary.
- Multiple addresses for the same club produce multiple buckets (Kogi Limoilou + Kogi Saint-Jean = 2 rows).
- Filter chips (search, pace, time-of-day, weekend) still apply — they reduce which buckets are visible.

Out of scope (other PRs in the queue):

- Faceted counts (B).
- Live home search (C).
- PIP mobile map (D).
- Clubs filter (E).
- Calendar filter (F).
- Footer auth link (G).

## Data shape

Introduce a new return type in the events service:

```ts
type EventLocation = {
  key: string // `${clubId}|${normalizedAddress}`
  club: { id; name; slug }
  address: string // canonical address
  latitude: number | null
  longitude: number | null
  recurrence: string // human-friendly: "Tuesdays + Thursdays" (locale-aware)
  next: {
    // the next upcoming occurrence (concrete OR virtual)
    id: string
    title: string
    date: Date
    time: string
    distance: string | null
    pace: string | null
    pacePolicy: PacePolicy | null
    eventUrl: string // /clubs/<slug>/events/<eventSlug>/<date>
  }
  occurrenceCount: number // total upcoming occurrences in the window
}
```

## Grouping logic

After `getEventsInRange(...)` returns the merged stream (concrete + virtual):

1. Normalize `address`:
   - Trim, collapse whitespace, lowercase the postal-code-free body.
   - If `lat/lng` is set, prefer rounding `(lat, lng)` to 4 decimals (≈ 11m precision) as the bucket key — same coordinates, same bucket. Falls back to normalized address when coords missing.
2. Bucket by `clubId + locationKey`.
3. For each bucket: pick the soonest event by `date + time` as `next`. Count the total occurrences for `occurrenceCount`. Collect the distinct day-of-week labels for `recurrence`.
4. Apply existing filters (search, pace, timeOfDay, weekend) against the bucket: a bucket passes if any occurrence in the bucket would pass.
5. Order buckets by `next.date`.

## Service signature

`getAllEvents` stays for legacy callers (returns individual events). A new `getEventLocations` returns `EventLocation[]`. This avoids a wide-ranging refactor in one PR — callers migrate over time.

## UI changes

- New `<EventLocationCard>` component replacing `EventCard` on `/events`. Renders:
  - Title (event title if it differs from club name, else club name).
  - Club link (subtitle).
  - Recurrence hint ("Tuesdays + Thursdays").
  - Next occurrence chip ("Next: Tue May 26 · 18:15").
  - Address line.
- New `<EventLocationMap>` (or extend `EventMap`) that takes `EventLocation[]` and renders one marker per bucket. Popup shows club + next + view-details link.

## /events page rewrite

Replace `getAllEvents` call + `groupEventsByDate` with `getEventLocations`. List is now flat (no date headings — recurrence string carries that load). Or keep a single "Next 30 days" heading.

## Home page

Home map already shares `EventMap` — switch to the location-grouped data shape so the same dedup applies. Hero map and `/events` map render identically.

## Tests

- Service: `getEventLocations` with seeded data exercising single-address, multi-address, override events, filters.
- Component: `EventLocationCard` renders title fallback, recurrence hint, next chip, address.
- E2E: visit `/events`, expect one Kogi row (not three).

## Implementation order

1. Service layer — `getEventLocations` + grouping helpers + unit tests.
2. Component — `EventLocationCard` + Storybook story.
3. Map — switch markers to bucket shape (popup tweaked).
4. Page — `/events` and home use the new shape.
5. Translations for recurrence labels.
6. Pinpoint pass at desktop + mobile, expect to see one row per (Kogi × location).
