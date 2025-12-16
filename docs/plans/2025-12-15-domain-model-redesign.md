# Quebec.run Domain Model Redesign

Design document from brainstorming session based on REFRAME.md use cases.

---

## 1. Data Model: Organization/Club Hierarchy

### Decision

Separate Organization model with Clubs as children. Every Club auto-gets an Organization (hidden for simple clubs, visible when they expand).

### Schema

```prisma
model Organization {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String?
  website     String?
  instagram   String?
  facebook    String?

  // Strava (for event-only orgs that are Strava clubs)
  stravaClubId  Int?
  stravaSlug    String?

  clubs       Club[]
  events      Event[]       // org-level events (not tied to club)
  addresses   Address[]     // for event-only orgs

  ownerId     String
  owner       User @relation(...)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Club {
  id             String   @id @default(cuid())
  name           String
  slug           String   @unique
  description    String?

  // Display settings
  isVisible      Boolean  @default(true)   // org visible in UI (false for simple clubs)
  isActive       Boolean  @default(true)   // paused = false
  welcomeInfo    String?                   // first-timer override

  // Categorization (for filters)
  type           ClubType?                 // TRAIL, ROAD, TRACK, MIXED
  vibe           ClubVibe?                 // SOCIAL, TRAINING, COMPETITIVE
  paceMin        String?                   // e.g., "5:00" min/km
  paceMax        String?                   // e.g., "7:00" min/km
  beginnerFriendly Boolean @default(false)

  organizationId String
  organization   Organization @relation(...)

  recurringEvents RecurringEvent[]
  events          Event[]
  addresses       Address[]

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

model Address {
  id          String   @id @default(cuid())
  label       String                       // "Main spot", "Alternate", etc.
  address     String
  lat         Float?
  lng         Float?

  // Belongs to either club or org (not both)
  clubId         String?
  club           Club? @relation(...)
  organizationId String?
  organization   Organization? @relation(...)

  createdAt   DateTime @default(now())
}

enum ClubType {
  TRAIL
  ROAD
  TRACK
  MIXED
}

enum ClubVibe {
  SOCIAL
  TRAINING
  COMPETITIVE
}
```

### Use Cases Covered

| Pattern                      | How it maps                                                        |
| ---------------------------- | ------------------------------------------------------------------ |
| Kogi Run (simple)            | Org auto-created, `isVisible=false`, single Club                   |
| Les Citrons Pressés          | Org auto-created, `isVisible=false`, Club with multiple Addresses  |
| WKND Trail (franchise)       | Org with `isVisible=true`, multiple Clubs (Lac Beauport, Stoneham) |
| Je Cours Québec (event-only) | Org with no Clubs, events attached to Org directly                 |

### Org-Level Events for Club-Based Orgs

Any Organization (even franchise orgs with clubs) can create org-level events not tied to a specific club:

- **WKND Trail** → "All-locations summer solstice run" (org event)
- **6AM Club** → "5th anniversary city-wide run" (org event)

**Event creation UI:**

- "Which club?" dropdown with options:
  - [List of org's clubs]
  - "Organization-wide (not club-specific)"

---

## 2. Hybrid Recurring Events

### Decision

Hybrid approach: weekly batch materialization + on-demand expansion for future dates.

### Materialization Strategy

**Weekly batch (cron job):**

- Every Sunday night, materialize events for the upcoming 7 days
- Creates concrete Event records for all active RecurringEvents
- This week's events = fast, simple queries

**On-demand expansion:**

- Beyond 7 days, expand RRULE patterns at query time
- No stale data for far-future dates

**Manual materialization:**

1. Owner edits/cancels specific occurrence
2. Owner pre-creates occurrence with custom details
3. User RSVPs or bookmarks
4. Synced from Strava

### Query Logic

```typescript
async function getEventsInRange(startDate: Date, endDate: Date) {
  // 1. Fetch concrete Events in range
  const concreteEvents = await prisma.event.findMany({
    where: { date: { gte: startDate, lte: endDate } },
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
      .map((e) => e.date.toISOString().split('T')[0])

    return occurrences
      .filter((date) => !materializedDates.includes(date))
      .map((date) => virtualEventFromPattern(re, date))
  })

  // 4. Merge and sort
  return [...concreteEvents, ...expandedEvents].sort((a, b) => a.date - b.date)
}
```

### Schema Changes

```prisma
model RecurringEvent {
  // ... existing fields ...
  isActive    Boolean @default(true)  // for pause/resume
}

model Event {
  // ... existing fields ...
  status      EventStatus @default(SCHEDULED)
}

enum EventStatus {
  SCHEDULED
  CANCELLED
}
```

### Pause Behavior

- Set `RecurringEvent.isActive = false`
- Weekly batch skips paused patterns (no new events created)
- Query excludes paused patterns from date expansion
- Already-materialized future events get `status = CANCELLED`

**Paused clubs in search:**

- Paused clubs still appear in general search (e.g., "trail clubs")
- Show pattern info without specific dates:
  > **Le WKND Trail — Lac Beauport**
  > Sundays @ 9am · Trail
  > ⏸️ _Currently paused_
- Do NOT appear in date-specific searches (e.g., "events on Dec 22")

---

## 3. User Discovery Filters

### Filter Categories

| Filter                  | Data source                         | UI                                   |
| ----------------------- | ----------------------------------- | ------------------------------------ |
| Type (trail/road/track) | `Club.type` enum                    | Dropdown                             |
| Pace range              | `Club.paceMin/paceMax`              | Dropdown with presets                |
| Day of week             | Event date / RecurringEvent pattern | Multi-select chips                   |
| Time of day             | Event time                          | Dropdown (Morning/Afternoon/Evening) |
| Distance (run length)   | `Event.distance`                    | Dropdown with ranges                 |
| Vibe                    | `Club.vibe` enum                    | Dropdown                             |
| Beginner-friendly       | `Club.beginnerFriendly`             | Toggle                               |
| Near me                 | Browser geolocation + event lat/lng | Toggle + radius                      |

### UI Pattern

Dropdown chips that stack as selected:

```
[Type ▾] [Day ▾] [Time ▾] [Pace ▾] [Vibe ▾] [Near me]

Active: Road · Wed, Fri · Morning · Easy pace · < 10km
```

---

## 4. First-Timer Onboarding

### Implementation

- Platform default guide stored as static content
- `Club.welcomeInfo` field for club-specific override
- Display: collapsible "New to run clubs?" section on club/event pages
- Logic: if `club.welcomeInfo` exists, show it; else show platform default

---

## 5. Consolidated Roadmap

### Track A: Merge Ready PRs (no schema conflict)

- [ ] PR #9: Map Markers
- [ ] PR #10: Staff Role Separation
- [ ] PR #11: Strava Integration
- [ ] Event Search & Filtering (basic - in progress)

### Track B: Schema Redesign (this design)

**Phase 1: Organization/Club Hierarchy**

- Add Organization model
- Add Address model
- Migrate existing Clubs (create matching Orgs with `isVisible=false`)
- Update all Club queries to include Organization
- Update Strava sync to work with new model

**Phase 2: Saved Addresses**

- CRUD for addresses (club or org level)
- Address picker in event creation form
- Auto-geocode on save

**Phase 3: Hybrid Recurring Events**

- Remove cron job pre-generation
- Implement RRULE expansion at query time
- Add materialization triggers (edit, cancel, RSVP)
- Add Event.status for cancellations
- Add RecurringEvent.isActive for pause
- Update all event queries for hybrid model

**Phase 4: Enhanced Filters**

- Add Club.type, Club.vibe, Club.paceMin/Max, Club.beginnerFriendly
- Add distance ranges to Event
- Implement filter UI (dropdown chips)
- Add geolocation "Near me" filter
- Backfill existing clubs with categorization

**Phase 5: Polish**

- First-timer onboarding (platform default + club override)
- Shareable widgets for social media
- UI for paused clubs ("Usually meets Tuesdays — currently paused")

---

## 6. Key Files to Modify

**Schema:**

- `prisma/schema.prisma`

**Services:**

- `src/lib/services/clubs.ts`
- `src/lib/services/events.ts`
- `src/lib/services/organizations.ts` (new)
- `src/lib/services/addresses.ts` (new)

**API Routes:**

- `src/app/api/clubs/...`
- `src/app/api/organizations/...` (new)
- `src/app/api/events/...`

**UI:**

- `src/app/(public)/clubs/...`
- `src/app/(public)/events/...`
- `src/app/(admin)/admin/clubs/...`
- `src/components/events/EventFilters.tsx` (new or enhance)

---

## Open Questions

None — all clarified during brainstorm.
