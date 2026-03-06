# Hybrid Recurring Events - Design Document

**Status:** Approved
**Created:** 2025-12-18
**Phase:** 3 (Core Implementation)

## Overview

Enable clubs to create repeating event patterns (RecurringEvents) that display in the events list through a hybrid approach: weekly batch materialization for near-term events (0-7 days) combined with on-demand expansion for future dates (7+ days).

## Architecture

### Three Data Sources

1. **Materialized Events** - Concrete Event records created by weekly cron (0-7 days ahead)
2. **On-Demand Expansion** - Virtual events expanded from RecurringEvent patterns at query time (7+ days)
3. **Manual Overrides** - Materialized events modified by owners (edits, cancellations)

### Key Invariant

When a concrete Event exists for a date+recurringEventId combination, it never appears in on-demand expansion. This prevents duplicates and preserves manual modifications.

### Schema (Complete from Phase 1)

```prisma
model RecurringEvent {
  id               String   @id @default(cuid())
  title            String
  description      String?
  address          String?
  latitude         Float?
  longitude        Float?
  distance         String?
  pace             String?
  schedulePattern  String   // RRule format
  timezone         String   @default("America/Toronto")
  isActive         Boolean  @default(true)  // Pause/resume
  generateUntil    DateTime?
  clubId           String
  club             Club     @relation(...)
  generatedEvents  Event[]
}

model Event {
  // ... existing fields
  status           EventStatus @default(SCHEDULED)
  recurringEventId String?
  recurringEvent   RecurringEvent? @relation(...)
}

enum EventStatus {
  SCHEDULED
  CANCELLED
}
```

## Hybrid Query Logic

### Core Function: `getEventsInRange(startDate, endDate)`

```typescript
async function getEventsInRange(startDate: Date, endDate: Date) {
  // 1. Fetch all concrete Events in range
  const concreteEvents = await prisma.event.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      status: 'SCHEDULED',
    },
  })

  // 2. Fetch active RecurringEvents
  const recurringEvents = await prisma.recurringEvent.findMany({
    where: { isActive: true },
    include: { club: true },
  })

  // 3. Expand patterns, excluding materialized dates
  const expandedEvents = recurringEvents.flatMap((re) => {
    const occurrences = expandRRule(re.schedulePattern, startDate, endDate)
    const materializedDates = concreteEvents
      .filter((e) => e.recurringEventId === re.id)
      .map((e) => formatDateKey(e.date))

    return occurrences
      .filter((date) => !materializedDates.includes(formatDateKey(date)))
      .map((date) => createVirtualEvent(re, date))
  })

  // 4. Merge and sort
  return [...concreteEvents, ...expandedEvents].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  )
}
```

### Virtual Event Structure

Virtual events are plain objects matching Event shape:

- `id`: `"${recurringEventId}:${dateKey}"` (temporary, not persisted)
- `isVirtual`: `true` (flag for client-side handling)
- All other fields copied from RecurringEvent

### Usage

Replaces current `getAllEvents` simple query. Used for:

- Homepage events list
- Club events page
- Future: Calendar views

**Performance:**

- Within 7 days: Simple DB query (all materialized)
- Beyond 7 days: Hybrid (concrete + virtual expansion)

## Materialization Strategy

### Weekly Batch Job

**Trigger:** Vercel Cron, every Sunday at 2am UTC
**Endpoint:** `/api/cron/materialize-events`
**Logic:** Calls `generateAllRecurringEvents(daysAhead: 7)`

```typescript
async function generateAllRecurringEvents(daysAhead: number = 7) {
  const recurringEvents = await prisma.recurringEvent.findMany({
    where: { isActive: true },
  })

  for (const re of recurringEvents) {
    await generateEventsFromRecurring(re, daysAhead)
  }
}
```

### Idempotency

```typescript
async function generateEventsFromRecurring(
  recurringEvent: RecurringEvent,
  daysAhead: number = 7
) {
  // 1. Expand RRule for next N days
  const dates = expandRRule(recurringEvent.schedulePattern, now, horizon)

  // 2. Check which dates already have Event records
  const existing = await prisma.event.findMany({
    where: {
      recurringEventId: recurringEvent.id,
      date: { in: dates },
    },
  })

  // 3. Create Events only for missing dates
  const newDates = dates.filter((d) => !existsInDB(d, existing))
  await prisma.event.createMany({ data: newDates.map(createEvent) })
}
```

**Why skip existing?**

- Preserves manual edits to specific occurrences
- Preserves cancellations (`status: CANCELLED`)
- Avoids duplicate events from overlapping cron runs

### Rolling Window Example

- **Week 1 (Dec 15):** Materialize Dec 15-21
- **Week 2 (Dec 22):** Materialize Dec 22-28
  - Dec 22-28 don't exist → CREATE
- **Week 3 (Dec 29):** Materialize Dec 29-Jan 4
  - Overlap handled by idempotency

### Vercel Cron Config

```json
{
  "crons": [
    {
      "path": "/api/cron/materialize-events",
      "schedule": "0 2 * * 0"
    }
  ]
}
```

## Pause/Resume Behavior

### Pause Pattern

```typescript
await updateRecurringEvent(id, { isActive: false })
// 1. Set isActive = false
// 2. Cancel all future materialized events
await prisma.event.updateMany({
  where: {
    recurringEventId: id,
    date: { gte: new Date() },
  },
  data: { status: 'CANCELLED' },
})
```

### Resume Pattern

```typescript
await updateRecurringEvent(id, { isActive: true })
// 1. Set isActive = true
// 2. Delete future CANCELLED events (let cron recreate)
await prisma.event.deleteMany({
  where: {
    recurringEventId: id,
    date: { gte: new Date() },
    status: 'CANCELLED',
  },
})
```

### Display in UI

**Paused patterns:**

- Appear in RecurringEvent list with "Paused" badge
- Occurrences do NOT appear in events list (isActive: false)
- Materialized CANCELLED events show as cancelled

## RRule Utilities

### Form State to RRule

```typescript
buildRRuleString({
  frequency: 'weekly',
  interval: 1,
  byweekday: ['TU', 'TH'],
  time: '18:00',
  until: null,
})
// → "FREQ=WEEKLY;BYDAY=TU,TH;BYHOUR=18;BYMINUTE=0"
```

### RRule to Form State

```typescript
parseRRuleToForm('FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0')
// → { frequency: 'weekly', interval: 1, byweekday: ['TU'], time: '18:00', until: null }
```

### Validation

```typescript
validateRRulePattern(rruleString)
// Throws if:
// - Invalid syntax
// - Generates >365 events/year (daily or more frequent)
```

## Phase 3 Deliverables

### Core Infrastructure

- RRule utilities (`rrule-builder.ts`) with build/parse/validate + tests
- Hybrid query service (`getEventsInRange`)
- Materialization service (`generateEventsFromRecurring`, `generateAllRecurringEvents`)
- RecurringEvent CRUD service functions

### API Layer

- `POST /api/recurring-events` - Create pattern
- `GET /api/recurring-events` - List patterns for club
- `GET /api/recurring-events/[id]` - Get single pattern
- `PUT /api/recurring-events/[id]` - Update pattern
- `DELETE /api/recurring-events/[id]` - Soft delete (sets `isActive: false`)
- `POST /api/cron/materialize-events` - Weekly batch job

### Admin UI

- `/admin/recurring-events` - List page (shows all patterns for user's clubs)
- `/admin/recurring-events/new` - Create page with RecurrenceBuilder
- `/admin/recurring-events/[id]/edit` - Edit pattern page
- Occurrence preview component (shows next 5 dates, read-only)

### Integration

- Update `getAllEvents` to use hybrid query
- Vercel Cron config (`vercel.json`)
- Event detail shows recurring badge (if `recurringEventId` exists)

## Out of Scope (Phase 3.5)

**Edit Individual Occurrences:**

- Occurrence list with edit/cancel actions per item
- "Edit this occurrence" → materializes + updates
- "Cancel this occurrence" → materializes + sets CANCELLED
- Pagination controls (← Previous 5 | Next 5 →)

**Rationale:** Defer to Phase 3.5 to ship core functionality faster. Once patterns work, add occurrence-level editing with better UX (vertical list with pagination).

## Technical Decisions

### Why RRule?

- RFC 5545 standard (iCalendar recurrence rules)
- Widely supported, battle-tested
- npm package `rrule` handles complex patterns

### Why 7 Days for Materialization?

- Most users browse events 1 week ahead
- Balances DB size vs query complexity
- Weekly cron aligns with user behavior

### Why Hybrid vs Pure Generation?

- **Pure generation** (materialize 60+ days): Large DB, stale far-future data
- **Pure on-demand** (no materialization): Complex queries, performance issues
- **Hybrid**: Best of both - fast queries near-term, flexibility long-term

### Why Soft Delete?

- Preserves history (which events were generated)
- Allows "resume" by setting `isActive: true` again
- Simpler than hard delete + cascade cleanup

## Migration Strategy

No schema migration needed (Phase 1 already added fields). Just:

1. Deploy code with hybrid query
2. Deploy Vercel Cron config
3. First cron run materializes next 7 days

## Testing Strategy

**Unit Tests:**

- RRule utilities (build, parse, validate)
- Materialization logic (idempotency, date filtering)
- Hybrid query (merging concrete + virtual)

**Integration Tests:**

- RecurringEvent CRUD with real DB
- Cron job batch processing
- Pause/resume behavior

**E2E Tests:**

- Create recurring pattern via UI
- Verify occurrences appear in events list
- Edit pattern → verify future occurrences update
- Pause pattern → verify occurrences disappear

## Future Enhancements (Post-Phase 3)

**Phase 3.5:**

- Edit/cancel individual occurrences with pagination UI

**Phase 4:**

- Full calendar view for visual context
- Drag-and-drop to reschedule occurrences

**Phase 5:**

- User RSVPs materialize events
- RSVP counts shown on occurrences
- Notification system for upcoming events

## Open Questions

None - all clarified during brainstorming.
