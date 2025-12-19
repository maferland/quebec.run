# Hybrid Recurring Events Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable clubs to create repeating event patterns with hybrid display strategy (weekly materialization + on-demand expansion).

**Architecture:** RRule-based patterns, weekly Vercel Cron materializes 0-7 days ahead, queries use hybrid approach (concrete DB events + virtual expanded events), idempotent generation preserves manual edits.

**Tech Stack:** RRule (RFC 5545), Prisma, Next.js 15 App Router, React Hook Form, Zod, Vercel Cron, Vitest

---

## Task 1: Install RRule Dependency

**Files:**

- Modify: `package.json`

**Step 1: Install rrule package**

```bash
npm install rrule
```

Expected: Package added to dependencies, lock file updated

**Step 2: Verify installation**

```bash
npm list rrule
```

Expected: Shows `rrule@2.8.1` or later

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add rrule for recurrence patterns"
```

---

## Task 2: RRule Builder Utilities (Part 1: Form to RRule)

**Files:**

- Create: `src/lib/utils/rrule-builder.ts`
- Create: `src/lib/utils/rrule-builder.test.ts`

**Step 1: Write failing test for buildRRuleString**

Create `src/lib/utils/rrule-builder.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { buildRRuleString } from './rrule-builder'

describe('buildRRuleString', () => {
  it('builds weekly pattern with single day', () => {
    const rrule = buildRRuleString({
      frequency: 'weekly',
      interval: 1,
      byweekday: ['TU'],
      time: '18:00',
      until: null,
    })

    expect(rrule).toBe('FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0')
  })

  it('builds weekly pattern with multiple days', () => {
    const rrule = buildRRuleString({
      frequency: 'weekly',
      interval: 1,
      byweekday: ['MO', 'WE', 'FR'],
      time: '06:30',
      until: null,
    })

    expect(rrule).toBe('FREQ=WEEKLY;BYDAY=MO,WE,FR;BYHOUR=6;BYMINUTE=30')
  })

  it('builds biweekly pattern', () => {
    const rrule = buildRRuleString({
      frequency: 'biweekly',
      interval: 2,
      byweekday: ['SA'],
      time: '08:00',
      until: null,
    })

    expect(rrule).toBe('FREQ=WEEKLY;INTERVAL=2;BYDAY=SA;BYHOUR=8;BYMINUTE=0')
  })

  it('includes until date when provided', () => {
    const until = new Date('2025-12-31')
    const rrule = buildRRuleString({
      frequency: 'weekly',
      interval: 1,
      byweekday: ['TU'],
      time: '18:00',
      until,
    })

    expect(rrule).toContain('UNTIL=20251231')
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npm test src/lib/utils/rrule-builder.test.ts
```

Expected: FAIL with "Cannot find module './rrule-builder'"

**Step 3: Write minimal implementation**

Create `src/lib/utils/rrule-builder.ts`:

```typescript
export type RecurrenceFormState = {
  frequency: 'weekly' | 'biweekly' | 'monthly'
  interval: number
  byweekday: string[] // ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']
  time: string // "HH:MM"
  until: Date | null
}

/**
 * Build RRule string from user-friendly form state
 * @param form - Form state with frequency, days, time
 * @returns RRule string (e.g., "FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0")
 */
export function buildRRuleString(form: RecurrenceFormState): string {
  const parts: string[] = []

  // Frequency
  if (form.frequency === 'monthly') {
    parts.push('FREQ=MONTHLY')
  } else {
    parts.push('FREQ=WEEKLY')
    if (form.interval > 1) {
      parts.push(`INTERVAL=${form.interval}`)
    }
  }

  // Days
  if (form.byweekday.length > 0) {
    parts.push(`BYDAY=${form.byweekday.join(',')}`)
  }

  // Time
  const [hour, minute] = form.time.split(':')
  const hourNum = parseInt(hour, 10)
  const minuteNum = parseInt(minute, 10)
  parts.push(`BYHOUR=${hourNum}`)
  parts.push(`BYMINUTE=${minuteNum}`)

  // Until
  if (form.until) {
    const year = form.until.getUTCFullYear()
    const month = String(form.until.getUTCMonth() + 1).padStart(2, '0')
    const day = String(form.until.getUTCDate()).padStart(2, '0')
    const formatted = `${year}${month}${day}`
    parts.push(`UNTIL=${formatted}`)
  }

  return parts.join(';')
}
```

**Step 4: Run test to verify it passes**

```bash
npm test src/lib/utils/rrule-builder.test.ts
```

Expected: PASS (4 tests)

**Step 5: Commit**

```bash
git add src/lib/utils/rrule-builder.ts src/lib/utils/rrule-builder.test.ts
git commit -m "feat: add buildRRuleString utility"
```

---

## Task 3: RRule Builder Utilities (Part 2: RRule to Form)

**Files:**

- Modify: `src/lib/utils/rrule-builder.ts`
- Modify: `src/lib/utils/rrule-builder.test.ts`

**Step 1: Write failing test for parseRRuleToForm**

Add to `src/lib/utils/rrule-builder.test.ts`:

```typescript
import { parseRRuleToForm } from './rrule-builder'

describe('parseRRuleToForm', () => {
  it('parses weekly pattern to form', () => {
    const form = parseRRuleToForm('FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0')

    expect(form).toEqual({
      frequency: 'weekly',
      interval: 1,
      byweekday: ['TU'],
      time: '18:00',
      until: null,
    })
  })

  it('parses biweekly pattern to form', () => {
    const form = parseRRuleToForm(
      'FREQ=WEEKLY;INTERVAL=2;BYDAY=SA;BYHOUR=8;BYMINUTE=0'
    )

    expect(form).toEqual({
      frequency: 'biweekly',
      interval: 2,
      byweekday: ['SA'],
      time: '08:00',
      until: null,
    })
  })

  it('parses pattern with multiple days', () => {
    const form = parseRRuleToForm(
      'FREQ=WEEKLY;BYDAY=MO,WE,FR;BYHOUR=6;BYMINUTE=30'
    )

    expect(form).toEqual({
      frequency: 'weekly',
      interval: 1,
      byweekday: ['MO', 'WE', 'FR'],
      time: '06:30',
      until: null,
    })
  })

  it('parses pattern with until date', () => {
    const form = parseRRuleToForm(
      'FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0;UNTIL=20251231'
    )

    expect(form.frequency).toBe('weekly')
    expect(form.byweekday).toEqual(['TU'])
    expect(form.time).toBe('18:00')
    expect(form.until).toBeInstanceOf(Date)
    expect(form.until?.getFullYear()).toBe(2025)
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npm test src/lib/utils/rrule-builder.test.ts
```

Expected: FAIL with "parseRRuleToForm is not a function"

**Step 3: Write minimal implementation**

Add to `src/lib/utils/rrule-builder.ts`:

```typescript
import { RRule } from 'rrule'

/**
 * Parse RRule string to user-friendly form state
 * @param rruleString - RRule string from database
 * @returns Form state for UI
 */
export function parseRRuleToForm(rruleString: string): RecurrenceFormState {
  const rule = RRule.fromString(rruleString)
  const opts = rule.options

  // Determine frequency UI value
  let frequency: 'weekly' | 'biweekly' | 'monthly'
  const interval = opts.interval || 1

  if (opts.freq === RRule.MONTHLY) {
    frequency = 'monthly'
  } else if (interval === 2) {
    frequency = 'biweekly'
  } else {
    frequency = 'weekly'
  }

  // Extract days
  const byweekday = (opts.byweekday || []).map((d) => {
    const weekday =
      typeof d === 'number' ? d : (d as { weekday: number }).weekday
    return ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'][weekday]
  })

  // Extract time
  const hour = String(opts.byhour?.[0] || 0).padStart(2, '0')
  const minute = String(opts.byminute?.[0] || 0).padStart(2, '0')
  const time = `${hour}:${minute}`

  return {
    frequency,
    interval,
    byweekday,
    time,
    until: opts.until || null,
  }
}
```

**Step 4: Run test to verify it passes**

```bash
npm test src/lib/utils/rrule-builder.test.ts
```

Expected: PASS (8 tests)

**Step 5: Commit**

```bash
git add src/lib/utils/rrule-builder.ts src/lib/utils/rrule-builder.test.ts
git commit -m "feat: add parseRRuleToForm utility"
```

---

## Task 4: RRule Validation Utility

**Files:**

- Modify: `src/lib/utils/rrule-builder.ts`
- Modify: `src/lib/utils/rrule-builder.test.ts`

**Step 1: Write failing test for validateRRulePattern**

Add to `src/lib/utils/rrule-builder.test.ts`:

```typescript
import { validateRRulePattern } from './rrule-builder'

describe('validateRRulePattern', () => {
  it('accepts valid weekly pattern', () => {
    expect(() => {
      validateRRulePattern('FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0')
    }).not.toThrow()
  })

  it('throws on invalid RRule syntax', () => {
    expect(() => {
      validateRRulePattern('INVALID_PATTERN')
    }).toThrow('Invalid recurrence pattern')
  })

  it('throws on pattern generating too many events', () => {
    expect(() => {
      validateRRulePattern('FREQ=DAILY;BYHOUR=18;BYMINUTE=0')
    }).toThrow('generates too many events')
  })

  it('accepts biweekly pattern under limit', () => {
    expect(() => {
      validateRRulePattern(
        'FREQ=WEEKLY;INTERVAL=2;BYDAY=SA;BYHOUR=8;BYMINUTE=0'
      )
    }).not.toThrow()
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npm test src/lib/utils/rrule-builder.test.ts
```

Expected: FAIL with "validateRRulePattern is not a function"

**Step 3: Write minimal implementation**

Add to `src/lib/utils/rrule-builder.ts`:

```typescript
import { addYears } from 'date-fns'

/**
 * Validate RRule pattern is parseable and safe
 * @param pattern - RRule string to validate
 * @throws Error if invalid or generates too many events
 */
export function validateRRulePattern(pattern: string): void {
  try {
    const rule = RRule.fromString(pattern)

    // Safety check: prevent patterns generating >=365 events/year
    const now = new Date()
    const oneYear = addYears(now, 1)
    const count = rule.between(now, oneYear, true).length

    if (count >= 365) {
      throw new Error(
        `Pattern generates too many events (${count}/year, max 365/year)`
      )
    }
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('generates too many')
    ) {
      throw error
    }
    throw new Error(`Invalid recurrence pattern: ${error}`)
  }
}
```

**Step 4: Run test to verify it passes**

```bash
npm test src/lib/utils/rrule-builder.test.ts
```

Expected: PASS (12 tests)

**Step 5: Commit**

```bash
git add src/lib/utils/rrule-builder.ts src/lib/utils/rrule-builder.test.ts
git commit -m "feat: add validateRRulePattern utility"
```

---

## Task 5: Recurring Event Zod Schemas

**Files:**

- Create: `src/lib/schemas/recurring-events.ts`
- Modify: `src/lib/schemas/index.ts`

**Step 1: Create schemas file**

Create `src/lib/schemas/recurring-events.ts`:

```typescript
import { z } from 'zod'

export const recurringEventCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  distance: z.string().optional(),
  pace: z.string().optional(),
  clubId: z.string().min(1, 'Club is required'),

  // Recurrence fields
  schedulePattern: z.string().min(1, 'Schedule pattern is required'),
  timezone: z.string().default('America/Toronto'),
  generateUntil: z.date().optional().nullable(),
  isActive: z.boolean().default(true),
})

export const recurringEventUpdateSchema = recurringEventCreateSchema
  .partial()
  .extend({
    id: z.string().min(1, 'ID is required'),
  })

export const recurringEventIdSchema = z.object({
  id: z.string().min(1, 'ID is required'),
})

export type RecurringEventCreateInput = z.infer<
  typeof recurringEventCreateSchema
>
export type RecurringEventUpdateInput = z.infer<
  typeof recurringEventUpdateSchema
>
export type RecurringEventIdInput = z.infer<typeof recurringEventIdSchema>
```

**Step 2: Export from index**

Add to `src/lib/schemas/index.ts`:

```typescript
export * from './recurring-events'
```

**Step 3: Commit**

```bash
git add src/lib/schemas/recurring-events.ts src/lib/schemas/index.ts
git commit -m "feat: add recurring event Zod schemas"
```

---

## Task 6: Materialization Service (Part 1: Single Pattern)

**Files:**

- Create: `src/lib/services/recurring-events.ts`
- Create: `src/lib/services/recurring-events.test.ts`

**Step 1: Write failing test for generateEventsFromRecurring**

Create `src/lib/services/recurring-events.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import { generateEventsFromRecurring } from './recurring-events'
import { addDays } from 'date-fns'

describe('generateEventsFromRecurring', () => {
  beforeEach(async () => {
    await prisma.event.deleteMany()
    await prisma.recurringEvent.deleteMany()
    await prisma.club.deleteMany()
    await prisma.organization.deleteMany()
    await prisma.user.deleteMany()
  })

  it('generates events for weekly pattern', async () => {
    const user = await prisma.user.create({
      data: { email: 'test@example.com' },
    })
    const org = await prisma.organization.create({
      data: {
        name: 'Test Org',
        slug: 'test-org',
        ownerId: user.id,
      },
    })
    const club = await prisma.club.create({
      data: {
        name: 'Test Club',
        slug: 'test-club',
        ownerId: user.id,
        organizationId: org.id,
      },
    })

    const recurring = await prisma.recurringEvent.create({
      data: {
        title: 'Tuesday Run',
        address: '123 Main St',
        clubId: club.id,
        schedulePattern: 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0',
        timezone: 'America/Toronto',
      },
    })

    const created = await generateEventsFromRecurring(recurring, 30)

    expect(created).toBeGreaterThan(0)

    const events = await prisma.event.findMany({
      where: { recurringEventId: recurring.id },
      orderBy: { date: 'asc' },
    })

    expect(events.length).toBeGreaterThanOrEqual(3)
    expect(events.length).toBeLessThanOrEqual(5)

    events.forEach((e) => {
      expect(e.date.getDay()).toBe(2) // Tuesday
      expect(e.time).toBe('18:00')
      expect(e.title).toBe('Tuesday Run')
    })
  })

  it('is idempotent - skips existing events', async () => {
    const user = await prisma.user.create({
      data: { email: 'test@example.com' },
    })
    const org = await prisma.organization.create({
      data: { name: 'Test Org', slug: 'test-org', ownerId: user.id },
    })
    const club = await prisma.club.create({
      data: {
        name: 'Test Club',
        slug: 'test-club',
        ownerId: user.id,
        organizationId: org.id,
      },
    })
    const recurring = await prisma.recurringEvent.create({
      data: {
        title: 'Tuesday Run',
        address: '123 Main St',
        clubId: club.id,
        schedulePattern: 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0',
      },
    })

    await generateEventsFromRecurring(recurring, 30)
    const firstCount = await prisma.event.count({
      where: { recurringEventId: recurring.id },
    })

    const created = await generateEventsFromRecurring(recurring, 30)

    expect(created).toBe(0)

    const secondCount = await prisma.event.count({
      where: { recurringEventId: recurring.id },
    })

    expect(secondCount).toBe(firstCount)
  })

  it('respects generateUntil date', async () => {
    const user = await prisma.user.create({
      data: { email: 'test@example.com' },
    })
    const org = await prisma.organization.create({
      data: { name: 'Test Org', slug: 'test-org', ownerId: user.id },
    })
    const club = await prisma.club.create({
      data: {
        name: 'Test Club',
        slug: 'test-club',
        ownerId: user.id,
        organizationId: org.id,
      },
    })

    const until = addDays(new Date(), 14)
    const recurring = await prisma.recurringEvent.create({
      data: {
        title: 'Tuesday Run',
        address: '123 Main St',
        clubId: club.id,
        schedulePattern: 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0',
        generateUntil: until,
      },
    })

    await generateEventsFromRecurring(recurring, 60)

    const events = await prisma.event.findMany({
      where: { recurringEventId: recurring.id },
    })

    expect(events.length).toBeGreaterThanOrEqual(1)
    expect(events.length).toBeLessThanOrEqual(3)

    events.forEach((e) => {
      expect(e.date.getTime()).toBeLessThanOrEqual(until.getTime())
    })
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npm test src/lib/services/recurring-events.test.ts
```

Expected: FAIL with "Cannot find module './recurring-events'"

**Step 3: Write minimal implementation**

Create `src/lib/services/recurring-events.ts`:

```typescript
import { prisma } from '@/lib/prisma'
import { RRule } from 'rrule'
import { addDays, min } from 'date-fns'
import type { RecurringEvent } from '@prisma/client'

/**
 * Generate Event records from RecurringEvent pattern
 * @param recurringEvent - RecurringEvent record from DB
 * @param daysAhead - How many days ahead to generate (default: 7)
 * @returns Number of events created
 */
export async function generateEventsFromRecurring(
  recurringEvent: RecurringEvent,
  daysAhead: number = 7
): Promise<number> {
  // 1. Parse RRule
  const rule = RRule.fromString(recurringEvent.schedulePattern)
  const opts = rule.options

  // Extract time from RRule options
  const hour = String(opts.byhour?.[0] ?? 0).padStart(2, '0')
  const minute = String(opts.byminute?.[0] ?? 0).padStart(2, '0')
  const eventTime = `${hour}:${minute}`

  // 2. Calculate date range
  const now = new Date()
  const horizon = addDays(now, daysAhead)
  const until = recurringEvent.generateUntil
    ? min([horizon, recurringEvent.generateUntil])
    : horizon

  // 3. Generate dates within range
  const dates = rule.between(now, until, true)

  if (dates.length === 0) {
    return 0
  }

  // 4. Check existing events (idempotency)
  const existing = await prisma.event.findMany({
    where: {
      recurringEventId: recurringEvent.id,
      date: { in: dates },
    },
    select: { date: true },
  })

  const existingDates = new Set(existing.map((e) => e.date.toISOString()))

  // 5. Filter to only new dates
  const newDates = dates.filter((d) => !existingDates.has(d.toISOString()))

  if (newDates.length === 0) {
    return 0
  }

  // 6. Create Event records
  const events = newDates.map((date) => ({
    title: recurringEvent.title,
    description: recurringEvent.description,
    date,
    time: eventTime,
    address: recurringEvent.address,
    latitude: recurringEvent.latitude,
    longitude: recurringEvent.longitude,
    distance: recurringEvent.distance,
    pace: recurringEvent.pace,
    clubId: recurringEvent.clubId,
    recurringEventId: recurringEvent.id,
  }))

  await prisma.event.createMany({ data: events })

  return events.length
}
```

**Step 4: Run test to verify it passes**

```bash
npm test src/lib/services/recurring-events.test.ts
```

Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add src/lib/services/recurring-events.ts src/lib/services/recurring-events.test.ts
git commit -m "feat: add generateEventsFromRecurring service"
```

---

## Task 7: Materialization Service (Part 2: Batch All Patterns)

**Files:**

- Modify: `src/lib/services/recurring-events.ts`
- Modify: `src/lib/services/recurring-events.test.ts`

**Step 1: Write failing test for generateAllRecurringEvents**

Add to `src/lib/services/recurring-events.test.ts`:

```typescript
import { generateAllRecurringEvents } from './recurring-events'

describe('generateAllRecurringEvents', () => {
  beforeEach(async () => {
    await prisma.event.deleteMany()
    await prisma.recurringEvent.deleteMany()
    await prisma.club.deleteMany()
    await prisma.organization.deleteMany()
    await prisma.user.deleteMany()
  })

  it('generates events for all active recurring events', async () => {
    const user = await prisma.user.create({
      data: { email: 'test@example.com' },
    })
    const org = await prisma.organization.create({
      data: { name: 'Test Org', slug: 'test-org', ownerId: user.id },
    })
    const club = await prisma.club.create({
      data: {
        name: 'Test Club',
        slug: 'test-club',
        ownerId: user.id,
        organizationId: org.id,
      },
    })

    await prisma.recurringEvent.create({
      data: {
        title: 'Tuesday Run',
        address: '123 Main St',
        clubId: club.id,
        schedulePattern: 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0',
        isActive: true,
      },
    })

    await prisma.recurringEvent.create({
      data: {
        title: 'Saturday Run',
        address: '456 Oak Ave',
        clubId: club.id,
        schedulePattern: 'FREQ=WEEKLY;BYDAY=SA;BYHOUR=8;BYMINUTE=0',
        isActive: true,
      },
    })

    await prisma.recurringEvent.create({
      data: {
        title: 'Inactive Run',
        address: '789 Elm St',
        clubId: club.id,
        schedulePattern: 'FREQ=WEEKLY;BYDAY=WE;BYHOUR=19;BYMINUTE=0',
        isActive: false,
      },
    })

    const result = await generateAllRecurringEvents(30)

    expect(result.processed).toBe(2)
    expect(result.created).toBeGreaterThan(0)
    expect(result.errors).toHaveLength(0)

    const inactiveEvents = await prisma.event.findMany({
      where: { title: 'Inactive Run' },
    })
    expect(inactiveEvents).toHaveLength(0)
  })

  it('continues batch on individual failures', async () => {
    const user = await prisma.user.create({
      data: { email: 'test@example.com' },
    })
    const org = await prisma.organization.create({
      data: { name: 'Test Org', slug: 'test-org', ownerId: user.id },
    })
    const club = await prisma.club.create({
      data: {
        name: 'Test Club',
        slug: 'test-club',
        ownerId: user.id,
        organizationId: org.id,
      },
    })

    await prisma.recurringEvent.create({
      data: {
        title: 'Valid Run',
        address: '123 Main St',
        clubId: club.id,
        schedulePattern: 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0',
        isActive: true,
      },
    })

    await prisma.recurringEvent.create({
      data: {
        title: 'Invalid Run',
        address: '456 Oak Ave',
        clubId: club.id,
        schedulePattern: 'INVALID_PATTERN',
        isActive: true,
      },
    })

    const result = await generateAllRecurringEvents(30)

    expect(result.processed).toBe(2)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.created).toBeGreaterThan(0)

    const validEvents = await prisma.event.findMany({
      where: { title: 'Valid Run' },
    })
    expect(validEvents.length).toBeGreaterThan(0)
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npm test src/lib/services/recurring-events.test.ts
```

Expected: FAIL with "generateAllRecurringEvents is not a function"

**Step 3: Write minimal implementation**

Add to `src/lib/services/recurring-events.ts`:

```typescript
/**
 * Generate events for all active recurring events
 * Called by cron job
 * @param daysAhead - How many days ahead to generate (default: 7)
 * @returns Summary with processed count, created count, and errors
 */
export async function generateAllRecurringEvents(
  daysAhead: number = 7
): Promise<{ processed: number; created: number; errors: string[] }> {
  const recurringEvents = await prisma.recurringEvent.findMany({
    where: { isActive: true },
  })

  let totalCreated = 0
  const errors: string[] = []

  for (const re of recurringEvents) {
    try {
      const created = await generateEventsFromRecurring(re, daysAhead)
      totalCreated += created
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      errors.push(`Failed for ${re.id}: ${message}`)
      console.error(`Generation failed for ${re.id}:`, error)
    }
  }

  return {
    processed: recurringEvents.length,
    created: totalCreated,
    errors,
  }
}
```

**Step 4: Run test to verify it passes**

```bash
npm test src/lib/services/recurring-events.test.ts
```

Expected: PASS (5 tests)

**Step 5: Commit**

```bash
git add src/lib/services/recurring-events.ts src/lib/services/recurring-events.test.ts
git commit -m "feat: add generateAllRecurringEvents batch service"
```

---

## Task 8: Hybrid Query Service (Part 1: Helper Functions)

**Files:**

- Modify: `src/lib/services/recurring-events.ts`
- Modify: `src/lib/services/recurring-events.test.ts`

**Step 1: Write failing tests for helper functions**

Add to `src/lib/services/recurring-events.test.ts`:

```typescript
import { expandRRuleDates, createVirtualEvent } from './recurring-events'

describe('Hybrid query helpers', () => {
  describe('expandRRuleDates', () => {
    it('expands weekly pattern for date range', () => {
      const pattern = 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0'
      const start = new Date('2025-12-16')
      const end = new Date('2025-12-30')

      const dates = expandRRuleDates(pattern, start, end)

      expect(dates.length).toBeGreaterThanOrEqual(2)
      dates.forEach((d) => expect(d.getDay()).toBe(2)) // Tuesday
    })

    it('returns empty array for dates outside pattern range', () => {
      const pattern = 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0;UNTIL=20251220'
      const start = new Date('2025-12-25')
      const end = new Date('2025-12-31')

      const dates = expandRRuleDates(pattern, start, end)

      expect(dates).toHaveLength(0)
    })
  })

  describe('createVirtualEvent', () => {
    it('creates virtual event from recurring pattern', async () => {
      const user = await prisma.user.create({
        data: { email: 'test@example.com' },
      })
      const org = await prisma.organization.create({
        data: { name: 'Test Org', slug: 'test-org', ownerId: user.id },
      })
      const club = await prisma.club.create({
        data: {
          name: 'Test Club',
          slug: 'test-club',
          ownerId: user.id,
          organizationId: org.id,
        },
      })

      const recurring = await prisma.recurringEvent.create({
        data: {
          title: 'Tuesday Run',
          description: 'Weekly run',
          address: '123 Main St',
          distance: '5km',
          clubId: club.id,
          schedulePattern: 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0',
        },
        include: { club: true },
      })

      const date = new Date('2025-12-24T18:00:00')
      const virtual = createVirtualEvent(recurring, date)

      expect(virtual.id).toContain(recurring.id)
      expect(virtual.id).toContain('2025-12-24')
      expect(virtual.title).toBe('Tuesday Run')
      expect(virtual.description).toBe('Weekly run')
      expect(virtual.address).toBe('123 Main St')
      expect(virtual.distance).toBe('5km')
      expect(virtual.date).toEqual(date)
      expect(virtual.time).toBe('18:00')
      expect(virtual.recurringEventId).toBe(recurring.id)
      expect(virtual.club).toEqual({
        id: club.id,
        name: club.name,
        slug: club.slug,
      })
    })
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npm test src/lib/services/recurring-events.test.ts
```

Expected: FAIL with function not found errors

**Step 3: Write minimal implementation**

Add to `src/lib/services/recurring-events.ts`:

```typescript
import { format } from 'date-fns'
import type { RecurringEvent, Club } from '@prisma/client'

/**
 * Expand RRule pattern to concrete dates within range
 * @param pattern - RRule string
 * @param startDate - Start of range
 * @param endDate - End of range
 * @returns Array of dates
 */
export function expandRRuleDates(
  pattern: string,
  startDate: Date,
  endDate: Date
): Date[] {
  const rule = RRule.fromString(pattern)
  return rule.between(startDate, endDate, true)
}

/**
 * Create virtual event object from RecurringEvent + date
 * @param recurringEvent - RecurringEvent with club relation
 * @param date - Specific occurrence date
 * @returns Virtual event object
 */
export function createVirtualEvent(
  recurringEvent: RecurringEvent & { club: Club },
  date: Date
) {
  const rule = RRule.fromString(recurringEvent.schedulePattern)
  const opts = rule.options

  const hour = String(opts.byhour?.[0] ?? 0).padStart(2, '0')
  const minute = String(opts.byminute?.[0] ?? 0).padStart(2, '0')
  const eventTime = `${hour}:${minute}`

  const dateKey = format(date, 'yyyy-MM-dd')

  return {
    id: `${recurringEvent.id}:${dateKey}`,
    title: recurringEvent.title,
    description: recurringEvent.description,
    date,
    time: eventTime,
    address: recurringEvent.address,
    latitude: recurringEvent.latitude,
    longitude: recurringEvent.longitude,
    distance: recurringEvent.distance,
    pace: recurringEvent.pace,
    status: 'SCHEDULED' as const,
    clubId: recurringEvent.clubId,
    organizationId: null,
    recurringEventId: recurringEvent.id,
    createdAt: recurringEvent.createdAt,
    updatedAt: recurringEvent.updatedAt,
    geocodedAt: null,
    club: {
      id: recurringEvent.club.id,
      name: recurringEvent.club.name,
      slug: recurringEvent.club.slug,
    },
  }
}
```

**Step 4: Run test to verify it passes**

```bash
npm test src/lib/services/recurring-events.test.ts
```

Expected: PASS (7 tests)

**Step 5: Commit**

```bash
git add src/lib/services/recurring-events.ts src/lib/services/recurring-events.test.ts
git commit -m "feat: add hybrid query helper functions"
```

---

## Task 9: Hybrid Query Service (Part 2: Main Query Function)

**Files:**

- Modify: `src/lib/services/recurring-events.ts`
- Modify: `src/lib/services/recurring-events.test.ts`

**Step 1: Write failing test for getEventsInRange**

Add to `src/lib/services/recurring-events.test.ts`:

```typescript
import { getEventsInRange } from './recurring-events'

describe('getEventsInRange', () => {
  beforeEach(async () => {
    await prisma.event.deleteMany()
    await prisma.recurringEvent.deleteMany()
    await prisma.club.deleteMany()
    await prisma.organization.deleteMany()
    await prisma.user.deleteMany()
  })

  it('returns concrete events only when no recurring patterns', async () => {
    const user = await prisma.user.create({
      data: { email: 'test@example.com' },
    })
    const org = await prisma.organization.create({
      data: { name: 'Test Org', slug: 'test-org', ownerId: user.id },
    })
    const club = await prisma.club.create({
      data: {
        name: 'Test Club',
        slug: 'test-club',
        ownerId: user.id,
        organizationId: org.id,
      },
    })

    await prisma.event.create({
      data: {
        title: 'One-time Event',
        date: new Date('2025-12-20'),
        time: '18:00',
        address: '123 Main St',
        clubId: club.id,
      },
    })

    const start = new Date('2025-12-15')
    const end = new Date('2025-12-31')
    const events = await getEventsInRange(start, end)

    expect(events).toHaveLength(1)
    expect(events[0].title).toBe('One-time Event')
  })

  it('returns hybrid mix of concrete and virtual events', async () => {
    const user = await prisma.user.create({
      data: { email: 'test@example.com' },
    })
    const org = await prisma.organization.create({
      data: { name: 'Test Org', slug: 'test-org', ownerId: user.id },
    })
    const club = await prisma.club.create({
      data: {
        name: 'Test Club',
        slug: 'test-club',
        ownerId: user.id,
        organizationId: org.id,
      },
    })

    // Create recurring pattern (weekly Tuesdays)
    const recurring = await prisma.recurringEvent.create({
      data: {
        title: 'Tuesday Run',
        address: '123 Main St',
        clubId: club.id,
        schedulePattern: 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0',
        isActive: true,
      },
    })

    // Materialize first Tuesday only
    await prisma.event.create({
      data: {
        title: 'Tuesday Run',
        date: new Date('2025-12-23'),
        time: '18:00',
        address: '123 Main St',
        clubId: club.id,
        recurringEventId: recurring.id,
      },
    })

    const start = new Date('2025-12-15')
    const end = new Date('2025-12-31')
    const events = await getEventsInRange(start, end)

    // Should have: 1 concrete (Dec 23) + 1 virtual (Dec 30)
    expect(events.length).toBeGreaterThanOrEqual(2)

    const dec23 = events.find(
      (e) => e.date.toISOString().split('T')[0] === '2025-12-23'
    )
    const dec30 = events.find(
      (e) => e.date.toISOString().split('T')[0] === '2025-12-30'
    )

    expect(dec23).toBeDefined()
    expect(dec30).toBeDefined()
    expect(dec23?.id).not.toContain(':') // Concrete (DB ID)
    expect(dec30?.id).toContain(':') // Virtual (composite ID)
  })

  it('excludes paused recurring patterns', async () => {
    const user = await prisma.user.create({
      data: { email: 'test@example.com' },
    })
    const org = await prisma.organization.create({
      data: { name: 'Test Org', slug: 'test-org', ownerId: user.id },
    })
    const club = await prisma.club.create({
      data: {
        name: 'Test Club',
        slug: 'test-club',
        ownerId: user.id,
        organizationId: org.id,
      },
    })

    await prisma.recurringEvent.create({
      data: {
        title: 'Paused Run',
        address: '123 Main St',
        clubId: club.id,
        schedulePattern: 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0',
        isActive: false,
      },
    })

    const start = new Date('2025-12-15')
    const end = new Date('2025-12-31')
    const events = await getEventsInRange(start, end)

    expect(events).toHaveLength(0)
  })

  it('excludes cancelled concrete events', async () => {
    const user = await prisma.user.create({
      data: { email: 'test@example.com' },
    })
    const org = await prisma.organization.create({
      data: { name: 'Test Org', slug: 'test-org', ownerId: user.id },
    })
    const club = await prisma.club.create({
      data: {
        name: 'Test Club',
        slug: 'test-club',
        ownerId: user.id,
        organizationId: org.id,
      },
    })

    await prisma.event.create({
      data: {
        title: 'Cancelled Event',
        date: new Date('2025-12-20'),
        time: '18:00',
        address: '123 Main St',
        clubId: club.id,
        status: 'CANCELLED',
      },
    })

    const start = new Date('2025-12-15')
    const end = new Date('2025-12-31')
    const events = await getEventsInRange(start, end)

    expect(events).toHaveLength(0)
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npm test src/lib/services/recurring-events.test.ts
```

Expected: FAIL with "getEventsInRange is not a function"

**Step 3: Write minimal implementation**

Add to `src/lib/services/recurring-events.ts`:

```typescript
/**
 * Get events in date range using hybrid approach
 * @param startDate - Start of range
 * @param endDate - End of range
 * @returns Array of concrete + virtual events, sorted by date
 */
export async function getEventsInRange(startDate: Date, endDate: Date) {
  // 1. Fetch concrete Events in range (exclude cancelled)
  const concreteEvents = await prisma.event.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      status: 'SCHEDULED',
    },
    include: {
      club: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    orderBy: { date: 'asc' },
  })

  // 2. Fetch active RecurringEvents with club relation
  const recurringEvents = await prisma.recurringEvent.findMany({
    where: { isActive: true },
    include: {
      club: true,
    },
  })

  // 3. Expand patterns, excluding materialized dates
  const expandedEvents = recurringEvents.flatMap((re) => {
    const occurrences = expandRRuleDates(re.schedulePattern, startDate, endDate)

    // Get materialized dates for this pattern
    const materializedDates = concreteEvents
      .filter((e) => e.recurringEventId === re.id)
      .map((e) => format(e.date, 'yyyy-MM-dd'))

    // Only expand dates that aren't materialized
    return occurrences
      .filter((date) => !materializedDates.includes(format(date, 'yyyy-MM-dd')))
      .map((date) => createVirtualEvent(re, date))
  })

  // 4. Merge and sort
  return [...concreteEvents, ...expandedEvents].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  )
}
```

**Step 4: Run test to verify it passes**

```bash
npm test src/lib/services/recurring-events.test.ts
```

Expected: PASS (11 tests)

**Step 5: Commit**

```bash
git add src/lib/services/recurring-events.ts src/lib/services/recurring-events.test.ts
git commit -m "feat: add getEventsInRange hybrid query"
```

---

## Task 10: RecurringEvent CRUD Service Functions

**Files:**

- Modify: `src/lib/services/recurring-events.ts`
- Modify: `src/lib/services/recurring-events.test.ts`

**Step 1: Write failing tests for CRUD**

Add to `src/lib/services/recurring-events.test.ts`:

```typescript
import {
  createRecurringEvent,
  updateRecurringEvent,
  deleteRecurringEvent,
  getRecurringEventById,
  getRecurringEventsByClub,
} from './recurring-events'

describe('CRUD operations', () => {
  beforeEach(async () => {
    await prisma.event.deleteMany()
    await prisma.recurringEvent.deleteMany()
    await prisma.club.deleteMany()
    await prisma.organization.deleteMany()
    await prisma.user.deleteMany()
  })

  describe('createRecurringEvent', () => {
    it('creates recurring event', async () => {
      const user = await prisma.user.create({
        data: { email: 'test@example.com' },
      })
      const org = await prisma.organization.create({
        data: { name: 'Test Org', slug: 'test-org', ownerId: user.id },
      })
      const club = await prisma.club.create({
        data: {
          name: 'Test Club',
          slug: 'test-club',
          ownerId: user.id,
          organizationId: org.id,
        },
      })

      const data = {
        title: 'Tuesday Run',
        address: '123 Main St',
        clubId: club.id,
        schedulePattern: 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0',
      }

      const result = await createRecurringEvent(data)

      expect(result.id).toBeDefined()
      expect(result.title).toBe('Tuesday Run')
      expect(result.isActive).toBe(true)
      expect(result.timezone).toBe('America/Toronto')
    })
  })

  describe('updateRecurringEvent', () => {
    it('updates recurring event', async () => {
      const user = await prisma.user.create({
        data: { email: 'test@example.com' },
      })
      const org = await prisma.organization.create({
        data: { name: 'Test Org', slug: 'test-org', ownerId: user.id },
      })
      const club = await prisma.club.create({
        data: {
          name: 'Test Club',
          slug: 'test-club',
          ownerId: user.id,
          organizationId: org.id,
        },
      })

      const recurring = await prisma.recurringEvent.create({
        data: {
          title: 'Old Title',
          address: '123 Main St',
          clubId: club.id,
          schedulePattern: 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0',
        },
      })

      const updated = await updateRecurringEvent(recurring.id, {
        title: 'New Title',
        address: '456 Oak Ave',
      })

      expect(updated.title).toBe('New Title')
      expect(updated.address).toBe('456 Oak Ave')
    })
  })

  describe('deleteRecurringEvent', () => {
    it('soft deletes recurring event', async () => {
      const user = await prisma.user.create({
        data: { email: 'test@example.com' },
      })
      const org = await prisma.organization.create({
        data: { name: 'Test Org', slug: 'test-org', ownerId: user.id },
      })
      const club = await prisma.club.create({
        data: {
          name: 'Test Club',
          slug: 'test-club',
          ownerId: user.id,
          organizationId: org.id,
        },
      })

      const recurring = await prisma.recurringEvent.create({
        data: {
          title: 'Tuesday Run',
          address: '123 Main St',
          clubId: club.id,
          schedulePattern: 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0',
        },
      })

      await deleteRecurringEvent(recurring.id)

      const deleted = await prisma.recurringEvent.findUnique({
        where: { id: recurring.id },
      })
      expect(deleted?.isActive).toBe(false)
    })
  })

  describe('getRecurringEventById', () => {
    it('returns recurring event with club relation', async () => {
      const user = await prisma.user.create({
        data: { email: 'test@example.com' },
      })
      const org = await prisma.organization.create({
        data: { name: 'Test Org', slug: 'test-org', ownerId: user.id },
      })
      const club = await prisma.club.create({
        data: {
          name: 'Test Club',
          slug: 'test-club',
          ownerId: user.id,
          organizationId: org.id,
        },
      })

      const recurring = await prisma.recurringEvent.create({
        data: {
          title: 'Tuesday Run',
          address: '123 Main St',
          clubId: club.id,
          schedulePattern: 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0',
        },
      })

      const result = await getRecurringEventById(recurring.id)

      expect(result?.id).toBe(recurring.id)
      expect(result?.club.name).toBe('Test Club')
    })

    it('returns null if not found', async () => {
      const result = await getRecurringEventById('nonexistent')
      expect(result).toBeNull()
    })
  })

  describe('getRecurringEventsByClub', () => {
    it('returns recurring events for club', async () => {
      const user = await prisma.user.create({
        data: { email: 'test@example.com' },
      })
      const org = await prisma.organization.create({
        data: { name: 'Test Org', slug: 'test-org', ownerId: user.id },
      })
      const club = await prisma.club.create({
        data: {
          name: 'Test Club',
          slug: 'test-club',
          ownerId: user.id,
          organizationId: org.id,
        },
      })

      await prisma.recurringEvent.create({
        data: {
          title: 'Tuesday Run',
          address: '123 Main St',
          clubId: club.id,
          schedulePattern: 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0',
        },
      })

      await prisma.recurringEvent.create({
        data: {
          title: 'Saturday Run',
          address: '456 Oak Ave',
          clubId: club.id,
          schedulePattern: 'FREQ=WEEKLY;BYDAY=SA;BYHOUR=8;BYMINUTE=0',
        },
      })

      const results = await getRecurringEventsByClub(club.id)

      expect(results).toHaveLength(2)
      expect(results[0].club.name).toBe('Test Club')
    })
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npm test src/lib/services/recurring-events.test.ts
```

Expected: FAIL with function not found errors

**Step 3: Write minimal implementation**

Add to `src/lib/services/recurring-events.ts`:

```typescript
import type { Prisma } from '@prisma/client'

/**
 * Create recurring event
 */
export async function createRecurringEvent(
  data: Prisma.RecurringEventUncheckedCreateInput
) {
  return await prisma.recurringEvent.create({
    data: {
      ...data,
      timezone: data.timezone || 'America/Toronto',
      isActive: data.isActive ?? true,
    },
  })
}

/**
 * Update recurring event
 */
export async function updateRecurringEvent(
  id: string,
  data: Partial<Prisma.RecurringEventUncheckedUpdateInput>
) {
  return await prisma.recurringEvent.update({
    where: { id },
    data,
  })
}

/**
 * Soft delete recurring event (set isActive = false)
 */
export async function deleteRecurringEvent(id: string) {
  return await prisma.recurringEvent.update({
    where: { id },
    data: { isActive: false },
  })
}

/**
 * Get recurring event by ID with club relation
 */
export async function getRecurringEventById(id: string) {
  return await prisma.recurringEvent.findUnique({
    where: { id },
    include: {
      club: true,
    },
  })
}

/**
 * Get recurring events by club ID
 */
export async function getRecurringEventsByClub(clubId: string) {
  return await prisma.recurringEvent.findMany({
    where: { clubId },
    include: {
      club: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}
```

**Step 4: Run test to verify it passes**

```bash
npm test src/lib/services/recurring-events.test.ts
```

Expected: PASS (16 tests)

**Step 5: Commit**

```bash
git add src/lib/services/recurring-events.ts src/lib/services/recurring-events.test.ts
git commit -m "feat: add RecurringEvent CRUD service functions"
```

---

## Task 11: Update Events Service to Use Hybrid Query

**Files:**

- Modify: `src/lib/services/events.ts`
- Modify: `src/lib/services/events.test.ts`

**Step 1: Write failing test for updated getAllEvents**

Add to `src/lib/services/events.test.ts`:

```typescript
it('returns hybrid events (concrete + virtual from recurring patterns)', async () => {
  const club = await createTestClub()

  // Create recurring pattern
  const recurring = await prisma.recurringEvent.create({
    data: {
      title: 'Weekly Run',
      address: '123 Main St',
      clubId: club.id,
      schedulePattern: 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0',
      isActive: true,
    },
  })

  // Create one concrete event
  await prisma.event.create({
    data: {
      title: 'Weekly Run',
      date: addDays(new Date(), 2),
      time: '18:00',
      address: '123 Main St',
      clubId: club.id,
      recurringEventId: recurring.id,
    },
  })

  const result = await getAllEvents({ data: { limit: 50, offset: 0 } })

  // Should include both concrete and virtual events
  expect(result.length).toBeGreaterThan(1)
})
```

**Step 2: Run test to verify it fails**

```bash
npm test src/lib/services/events.test.ts
```

Expected: FAIL (new test fails, existing tests pass)

**Step 3: Update getAllEvents to use hybrid query**

Modify `src/lib/services/events.ts`:

```typescript
import { getEventsInRange } from './recurring-events'

export const getAllEvents = async ({ data }: PublicPayload<EventsQuery>) => {
  const { limit = 50, offset = 0, clubId } = data

  // Calculate date range (today + next 60 days for good coverage)
  const startDate = new Date()
  startDate.setHours(0, 0, 0, 0)
  const endDate = addDays(startDate, 60)

  // Use hybrid query
  let events = await getEventsInRange(startDate, endDate)

  // Filter by club if specified
  if (clubId) {
    events = events.filter((e) => e.clubId === clubId)
  }

  // Apply pagination
  const paginatedEvents = events.slice(offset, offset + limit)

  return paginatedEvents
}
```

**Step 4: Run test to verify it passes**

```bash
npm test src/lib/services/events.test.ts
```

Expected: PASS (all tests including new one)

**Step 5: Commit**

```bash
git add src/lib/services/events.ts src/lib/services/events.test.ts
git commit -m "feat: update getAllEvents to use hybrid query"
```

---

## Task 12: Cron API Route

**Files:**

- Create: `src/app/api/cron/materialize-events/route.ts`
- Create: `src/app/api/cron/materialize-events/route.test.ts`

**Step 1: Write failing test for cron route**

Create `src/app/api/cron/materialize-events/route.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { POST } from './route'
import { prisma } from '@/lib/prisma'

describe('POST /api/cron/materialize-events', () => {
  beforeEach(async () => {
    await prisma.event.deleteMany()
    await prisma.recurringEvent.deleteMany()
    await prisma.club.deleteMany()
    await prisma.organization.deleteMany()
    await prisma.user.deleteMany()
  })

  it('materializes events for active recurring patterns', async () => {
    const user = await prisma.user.create({
      data: { email: 'test@example.com' },
    })
    const org = await prisma.organization.create({
      data: { name: 'Test Org', slug: 'test-org', ownerId: user.id },
    })
    const club = await prisma.club.create({
      data: {
        name: 'Test Club',
        slug: 'test-club',
        ownerId: user.id,
        organizationId: org.id,
      },
    })

    await prisma.recurringEvent.create({
      data: {
        title: 'Tuesday Run',
        address: '123 Main St',
        clubId: club.id,
        schedulePattern: 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0',
        isActive: true,
      },
    })

    const response = await POST()
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.processed).toBeGreaterThan(0)
    expect(json.created).toBeGreaterThan(0)

    const events = await prisma.event.count()
    expect(events).toBeGreaterThan(0)
  })

  it('returns 500 on error', async () => {
    // Create invalid pattern
    const user = await prisma.user.create({
      data: { email: 'test@example.com' },
    })
    const org = await prisma.organization.create({
      data: { name: 'Test Org', slug: 'test-org', ownerId: user.id },
    })
    const club = await prisma.club.create({
      data: {
        name: 'Test Club',
        slug: 'test-club',
        ownerId: user.id,
        organizationId: org.id,
      },
    })

    await prisma.recurringEvent.create({
      data: {
        title: 'Invalid Run',
        address: '123 Main St',
        clubId: club.id,
        schedulePattern: 'INVALID_PATTERN',
        isActive: true,
      },
    })

    const response = await POST()
    const json = await response.json()

    expect(response.status).toBe(200) // Still 200, but with errors
    expect(json.errors).toBeDefined()
    expect(json.errors.length).toBeGreaterThan(0)
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npm test src/app/api/cron/materialize-events/route.test.ts
```

Expected: FAIL with "Cannot find module './route'"

**Step 3: Write minimal implementation**

Create `src/app/api/cron/materialize-events/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { generateAllRecurringEvents } from '@/lib/services/recurring-events'

/**
 * Cron endpoint to materialize recurring events
 * Triggered by Vercel Cron (weekly, Sunday 2am UTC)
 */
export async function POST() {
  try {
    const result = await generateAllRecurringEvents(7) // 7 days ahead

    console.log('Event materialization complete:', result)

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('Event materialization failed:', error)

    return NextResponse.json(
      {
        error: 'Materialization failed',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
```

**Step 4: Run test to verify it passes**

```bash
npm test src/app/api/cron/materialize-events/route.test.ts
```

Expected: PASS (2 tests)

**Step 5: Commit**

```bash
git add src/app/api/cron/materialize-events/route.ts src/app/api/cron/materialize-events/route.test.ts
git commit -m "feat: add cron API route for materialization"
```

---

## Task 13: Vercel Cron Configuration

**Files:**

- Create: `vercel.json`

**Step 1: Create Vercel cron config**

Create `vercel.json`:

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

**Step 2: Verify JSON syntax**

```bash
cat vercel.json | npx jsonlint
```

Expected: Valid JSON (no errors)

**Step 3: Commit**

```bash
git add vercel.json
git commit -m "feat: add Vercel cron config for weekly materialization"
```

---

## Task 14: RecurringEvent API Routes (CRUD)

**Files:**

- Create: `src/app/api/recurring-events/route.ts`
- Create: `src/app/api/recurring-events/[id]/route.ts`

**Step 1: Create list/create route**

Create `src/app/api/recurring-events/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  createRecurringEvent,
  getRecurringEventsByClub,
} from '@/lib/services/recurring-events'
import { recurringEventCreateSchema } from '@/lib/schemas'

/**
 * GET /api/recurring-events?clubId=xxx
 * List recurring events for club
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const clubId = searchParams.get('clubId')

  if (!clubId) {
    return NextResponse.json({ error: 'clubId required' }, { status: 400 })
  }

  try {
    const events = await getRecurringEventsByClub(clubId)
    return NextResponse.json(events)
  } catch (error) {
    console.error('Failed to fetch recurring events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recurring events' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/recurring-events
 * Create recurring event
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const data = recurringEventCreateSchema.parse(body)

    // TODO: Check user owns club

    const event = await createRecurringEvent(data)
    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error('Failed to create recurring event:', error)
    return NextResponse.json(
      { error: 'Failed to create recurring event' },
      { status: 500 }
    )
  }
}
```

**Step 2: Create detail route (get/update/delete)**

Create `src/app/api/recurring-events/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  getRecurringEventById,
  updateRecurringEvent,
  deleteRecurringEvent,
} from '@/lib/services/recurring-events'
import { recurringEventUpdateSchema } from '@/lib/schemas'

/**
 * GET /api/recurring-events/[id]
 * Get recurring event by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const event = await getRecurringEventById(id)

    if (!event) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(event)
  } catch (error) {
    console.error('Failed to fetch recurring event:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recurring event' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/recurring-events/[id]
 * Update recurring event
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const data = recurringEventUpdateSchema.parse({ ...body, id })

    // TODO: Check user owns club

    const event = await updateRecurringEvent(id, data)
    return NextResponse.json(event)
  } catch (error) {
    console.error('Failed to update recurring event:', error)
    return NextResponse.json(
      { error: 'Failed to update recurring event' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/recurring-events/[id]
 * Soft delete recurring event
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // TODO: Check user owns club

    await deleteRecurringEvent(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete recurring event:', error)
    return NextResponse.json(
      { error: 'Failed to delete recurring event' },
      { status: 500 }
    )
  }
}
```

**Step 3: Commit**

```bash
git add src/app/api/recurring-events/route.ts src/app/api/recurring-events/[id]/route.ts
git commit -m "feat: add RecurringEvent API routes (CRUD)"
```

---

## Task 15: React Query Hooks for RecurringEvents

**Files:**

- Create: `src/lib/hooks/use-recurring-events.ts`

**Step 1: Create hooks file**

Create `src/lib/hooks/use-recurring-events.ts`:

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { RecurringEvent, Club } from '@prisma/client'
import type {
  RecurringEventCreateInput,
  RecurringEventUpdateInput,
} from '@/lib/schemas'

type RecurringEventWithClub = RecurringEvent & { club: Club }

/**
 * Fetch recurring events for club
 */
export function useRecurringEvents(clubId: string) {
  return useQuery({
    queryKey: ['recurring-events', clubId],
    queryFn: async () => {
      const response = await fetch(`/api/recurring-events?clubId=${clubId}`)
      if (!response.ok) throw new Error('Failed to fetch recurring events')
      return response.json() as Promise<RecurringEventWithClub[]>
    },
  })
}

/**
 * Fetch single recurring event by ID
 */
export function useRecurringEvent(id: string) {
  return useQuery({
    queryKey: ['recurring-event', id],
    queryFn: async () => {
      const response = await fetch(`/api/recurring-events/${id}`)
      if (!response.ok) throw new Error('Failed to fetch recurring event')
      return response.json() as Promise<RecurringEventWithClub>
    },
    enabled: !!id,
  })
}

/**
 * Create recurring event
 */
export function useCreateRecurringEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: RecurringEventCreateInput) => {
      const response = await fetch('/api/recurring-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to create recurring event')
      return response.json() as Promise<RecurringEvent>
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['recurring-events', data.clubId],
      })
    },
  })
}

/**
 * Update recurring event
 */
export function useUpdateRecurringEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: RecurringEventUpdateInput) => {
      const response = await fetch(`/api/recurring-events/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to update recurring event')
      return response.json() as Promise<RecurringEvent>
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['recurring-event', data.id],
      })
      queryClient.invalidateQueries({
        queryKey: ['recurring-events', data.clubId],
      })
    },
  })
}

/**
 * Delete recurring event
 */
export function useDeleteRecurringEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/recurring-events/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete recurring event')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-events'] })
    },
  })
}
```

**Step 2: Commit**

```bash
git add src/lib/hooks/use-recurring-events.ts
git commit -m "feat: add React Query hooks for recurring events"
```

---

## Task 16: RecurrenceBuilder Component

**Files:**

- Create: `src/components/admin/recurrence-builder.tsx`
- Create: `src/components/admin/recurrence-builder.test.tsx`

**Step 1: Write failing test**

Create `src/components/admin/recurrence-builder.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RecurrenceBuilder } from './recurrence-builder'

describe('RecurrenceBuilder', () => {
  it('renders frequency selector', () => {
    const onChange = vi.fn()
    render(
      <RecurrenceBuilder
        value={{
          frequency: 'weekly',
          interval: 1,
          byweekday: [],
          time: '18:00',
          until: null,
        }}
        onChange={onChange}
      />
    )

    expect(screen.getByLabelText(/frequency/i)).toBeInTheDocument()
  })

  it('calls onChange when frequency changes', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(
      <RecurrenceBuilder
        value={{
          frequency: 'weekly',
          interval: 1,
          byweekday: [],
          time: '18:00',
          until: null,
        }}
        onChange={onChange}
      />
    )

    const select = screen.getByLabelText(/frequency/i)
    await user.selectOptions(select, 'biweekly')

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ frequency: 'biweekly' })
    )
  })

  it('renders day checkboxes for weekly patterns', () => {
    const onChange = vi.fn()
    render(
      <RecurrenceBuilder
        value={{
          frequency: 'weekly',
          interval: 1,
          byweekday: ['TU'],
          time: '18:00',
          until: null,
        }}
        onChange={onChange}
      />
    )

    expect(screen.getByLabelText(/monday/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/tuesday/i)).toBeChecked()
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npm test src/components/admin/recurrence-builder.test.tsx
```

Expected: FAIL with "Cannot find module './recurrence-builder'"

**Step 3: Write minimal implementation**

Create `src/components/admin/recurrence-builder.tsx`:

```typescript
'use client'

import type { RecurrenceFormState } from '@/lib/utils/rrule-builder'

interface RecurrenceBuilderProps {
  value: RecurrenceFormState
  onChange: (value: RecurrenceFormState) => void
}

const WEEKDAYS = [
  { value: 'MO', label: 'Monday' },
  { value: 'TU', label: 'Tuesday' },
  { value: 'WE', label: 'Wednesday' },
  { value: 'TH', label: 'Thursday' },
  { value: 'FR', label: 'Friday' },
  { value: 'SA', label: 'Saturday' },
  { value: 'SU', label: 'Sunday' },
]

export function RecurrenceBuilder({ value, onChange }: RecurrenceBuilderProps) {
  const handleFrequencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const frequency = e.target.value as RecurrenceFormState['frequency']
    onChange({
      ...value,
      frequency,
      interval: frequency === 'biweekly' ? 2 : 1,
    })
  }

  const handleDayToggle = (day: string) => {
    const newDays = value.byweekday.includes(day)
      ? value.byweekday.filter((d) => d !== day)
      : [...value.byweekday, day]

    onChange({ ...value, byweekday: newDays })
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, time: e.target.value })
  }

  return (
    <div className="space-y-4">
      {/* Frequency */}
      <div>
        <label
          htmlFor="frequency"
          className="block text-sm font-medium mb-1"
        >
          Frequency
        </label>
        <select
          id="frequency"
          value={value.frequency}
          onChange={handleFrequencyChange}
          className="w-full border rounded px-3 py-2"
        >
          <option value="weekly">Weekly</option>
          <option value="biweekly">Biweekly (every 2 weeks)</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      {/* Days (for weekly/biweekly) */}
      {value.frequency !== 'monthly' && (
        <div>
          <label className="block text-sm font-medium mb-2">Days</label>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((day) => (
              <label key={day.value} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={value.byweekday.includes(day.value)}
                  onChange={() => handleDayToggle(day.value)}
                  className="rounded"
                />
                <span className="text-sm">{day.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Time */}
      <div>
        <label htmlFor="time" className="block text-sm font-medium mb-1">
          Time
        </label>
        <input
          id="time"
          type="time"
          value={value.time}
          onChange={handleTimeChange}
          className="border rounded px-3 py-2"
        />
      </div>
    </div>
  )
}
```

**Step 4: Run test to verify it passes**

```bash
npm test src/components/admin/recurrence-builder.test.tsx
```

Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add src/components/admin/recurrence-builder.tsx src/components/admin/recurrence-builder.test.tsx
git commit -m "feat: add RecurrenceBuilder component"
```

---

## Task 17: OccurrencePreview Component

**Files:**

- Create: `src/components/admin/occurrence-preview.tsx`
- Create: `src/components/admin/occurrence-preview.test.tsx`

**Step 1: Write failing test**

Create `src/components/admin/occurrence-preview.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OccurrencePreview } from './occurrence-preview'

describe('OccurrencePreview', () => {
  it('renders next occurrences', () => {
    const pattern = 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0'

    render(<OccurrencePreview pattern={pattern} count={5} />)

    expect(screen.getByText(/next occurrences/i)).toBeInTheDocument()
  })

  it('shows message when pattern is invalid', () => {
    const pattern = 'INVALID_PATTERN'

    render(<OccurrencePreview pattern={pattern} count={5} />)

    expect(screen.getByText(/invalid/i)).toBeInTheDocument()
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npm test src/components/admin/occurrence-preview.test.tsx
```

Expected: FAIL with "Cannot find module './occurrence-preview'"

**Step 3: Write minimal implementation**

Create `src/components/admin/occurrence-preview.tsx`:

```typescript
'use client'

import { RRule } from 'rrule'
import { format } from 'date-fns'

interface OccurrencePreviewProps {
  pattern: string
  count?: number
}

export function OccurrencePreview({
  pattern,
  count = 5,
}: OccurrencePreviewProps) {
  let dates: Date[] = []
  let error: string | null = null

  try {
    const rule = RRule.fromString(pattern)
    const now = new Date()
    dates = rule.all((date) => date >= now, count)
  } catch (e) {
    error = 'Invalid recurrence pattern'
  }

  if (error) {
    return (
      <div className="text-sm text-red-600" role="alert">
        {error}
      </div>
    )
  }

  if (dates.length === 0) {
    return (
      <div className="text-sm text-text-secondary">
        No upcoming occurrences
      </div>
    )
  }

  return (
    <div>
      <h4 className="text-sm font-medium mb-2">Next occurrences:</h4>
      <ul className="space-y-1">
        {dates.map((date, i) => (
          <li key={i} className="text-sm text-text-secondary">
            {format(date, 'EEE, MMM d, yyyy')} at {format(date, 'h:mm a')}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

**Step 4: Run test to verify it passes**

```bash
npm test src/components/admin/occurrence-preview.test.tsx
```

Expected: PASS (2 tests)

**Step 5: Commit**

```bash
git add src/components/admin/occurrence-preview.tsx src/components/admin/occurrence-preview.test.tsx
git commit -m "feat: add OccurrencePreview component"
```

---

## Task 18: RecurringEventForm Component

**Files:**

- Create: `src/components/admin/recurring-event-form.tsx`
- Create: `src/components/admin/recurring-event-form.test.tsx`

**Step 1: Write failing test**

Create `src/components/admin/recurring-event-form.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RecurringEventForm } from './recurring-event-form'

vi.mock('@/lib/hooks/use-recurring-events', () => ({
  useCreateRecurringEvent: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useUpdateRecurringEvent: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}))

describe('RecurringEventForm', () => {
  it('renders form fields', () => {
    render(
      <RecurringEventForm
        mode="create"
        clubId="test-club"
        onSuccess={vi.fn()}
      />
    )

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/address/i)).toBeInTheDocument()
  })

  it('shows recurrence builder', () => {
    render(
      <RecurringEventForm
        mode="create"
        clubId="test-club"
        onSuccess={vi.fn()}
      />
    )

    expect(screen.getByLabelText(/frequency/i)).toBeInTheDocument()
  })

  it('shows occurrence preview', () => {
    render(
      <RecurringEventForm
        mode="create"
        clubId="test-club"
        onSuccess={vi.fn()}
      />
    )

    expect(screen.getByText(/next occurrences/i)).toBeInTheDocument()
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npm test src/components/admin/recurring-event-form.test.tsx
```

Expected: FAIL with "Cannot find module './recurring-event-form'"

**Step 3: Write minimal implementation**

Create `src/components/admin/recurring-event-form.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { recurringEventCreateSchema } from '@/lib/schemas'
import {
  useCreateRecurringEvent,
  useUpdateRecurringEvent,
} from '@/lib/hooks/use-recurring-events'
import {
  buildRRuleString,
  parseRRuleToForm,
  type RecurrenceFormState,
} from '@/lib/utils/rrule-builder'
import { RecurrenceBuilder } from './recurrence-builder'
import { OccurrencePreview } from './occurrence-preview'
import { FormInput } from '@/components/ui/form-input'
import { FormTextarea } from '@/components/ui/form-textarea'
import { Button } from '@/components/ui/button'
import type { RecurringEvent } from '@prisma/client'

interface RecurringEventFormProps {
  mode: 'create' | 'edit'
  clubId: string
  initialData?: RecurringEvent
  onSuccess?: () => void
}

export function RecurringEventForm({
  mode,
  clubId,
  initialData,
  onSuccess,
}: RecurringEventFormProps) {
  const [recurrence, setRecurrence] = useState<RecurrenceFormState>(
    initialData
      ? parseRRuleToForm(initialData.schedulePattern)
      : {
          frequency: 'weekly',
          interval: 1,
          byweekday: [],
          time: '18:00',
          until: null,
        }
  )

  const createMutation = useCreateRecurringEvent()
  const updateMutation = useUpdateRecurringEvent()

  const form = useForm({
    resolver: zodResolver(recurringEventCreateSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      address: initialData?.address || '',
      distance: initialData?.distance || '',
      pace: initialData?.pace || '',
      clubId,
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form

  const schedulePattern = buildRRuleString(recurrence)

  const onSubmit = handleSubmit(async (data) => {
    try {
      const payload = {
        ...data,
        schedulePattern,
        clubId,
      }

      if (mode === 'create') {
        await createMutation.mutateAsync(payload)
      } else if (initialData) {
        await updateMutation.mutateAsync({
          ...payload,
          id: initialData.id,
        })
      }

      onSuccess?.()
    } catch (error) {
      console.error('Form submission error:', error)
    }
  })

  const isLoading = isSubmitting || createMutation.isPending || updateMutation.isPending

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <FormInput
        register={register}
        name="title"
        label="Title"
        error={errors.title}
        required
      />

      <FormTextarea
        register={register}
        name="description"
        label="Description"
        error={errors.description}
        rows={3}
      />

      <FormInput
        register={register}
        name="address"
        label="Address"
        error={errors.address}
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <FormInput
          register={register}
          name="distance"
          label="Distance"
          error={errors.distance}
          placeholder="e.g., 5km"
        />

        <FormInput
          register={register}
          name="pace"
          label="Pace"
          error={errors.pace}
          placeholder="e.g., Easy, 5:30/km"
        />
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium mb-4">Recurrence Pattern</h3>
        <RecurrenceBuilder value={recurrence} onChange={setRecurrence} />
      </div>

      <div className="border-t pt-6">
        <OccurrencePreview pattern={schedulePattern} count={5} />
      </div>

      <div className="flex justify-end gap-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? mode === 'create'
              ? 'Creating...'
              : 'Updating...'
            : mode === 'create'
              ? 'Create'
              : 'Update'}
        </Button>
      </div>
    </form>
  )
}
```

**Step 4: Run test to verify it passes**

```bash
npm test src/components/admin/recurring-event-form.test.tsx
```

Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add src/components/admin/recurring-event-form.tsx src/components/admin/recurring-event-form.test.tsx
git commit -m "feat: add RecurringEventForm component"
```

---

## Task 19: Admin Pages (List/Create/Edit)

**Files:**

- Create: `src/app/[locale]/admin/recurring-events/page.tsx`
- Create: `src/app/[locale]/admin/recurring-events/new/page.tsx`
- Create: `src/app/[locale]/admin/recurring-events/[id]/edit/page.tsx`

**Step 1: Create list page**

Create `src/app/[locale]/admin/recurring-events/page.tsx`:

```typescript
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { useClubs } from '@/lib/hooks/use-clubs'
import { useRecurringEvents } from '@/lib/hooks/use-recurring-events'
import { Button } from '@/components/ui/button'

export default function RecurringEventsListPage() {
  const { data: clubs } = useClubs()
  const [selectedClubId, setSelectedClubId] = useState<string>('')

  const { data: events, isLoading } = useRecurringEvents(
    selectedClubId || (clubs?.[0]?.id ?? '')
  )

  if (!clubs || clubs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">No clubs found</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Recurring Events</h1>
        <Link href="/admin/recurring-events/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Pattern
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <label htmlFor="club-select" className="block text-sm font-medium mb-2">
          Club
        </label>
        <select
          id="club-select"
          value={selectedClubId || clubs[0]?.id}
          onChange={(e) => setSelectedClubId(e.target.value)}
          className="border rounded px-3 py-2"
        >
          {clubs.map((club) => (
            <option key={club.id} value={club.id}>
              {club.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : events && events.length > 0 ? (
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="border rounded p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{event.title}</h3>
                  <p className="text-sm text-text-secondary">
                    {event.address}
                  </p>
                  {!event.isActive && (
                    <span className="text-sm text-red-600">Paused</span>
                  )}
                </div>
                <Link href={`/admin/recurring-events/${event.id}/edit`}>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-text-secondary">No recurring events yet</p>
        </div>
      )}
    </div>
  )
}
```

**Step 2: Create new page**

Create `src/app/[locale]/admin/recurring-events/new/page.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useClubs } from '@/lib/hooks/use-clubs'
import { RecurringEventForm } from '@/components/admin/recurring-event-form'

export default function NewRecurringEventPage() {
  const router = useRouter()
  const { data: clubs } = useClubs()
  const [selectedClubId, setSelectedClubId] = useState<string>('')

  useEffect(() => {
    if (clubs && clubs.length > 0 && !selectedClubId) {
      setSelectedClubId(clubs[0].id)
    }
  }, [clubs, selectedClubId])

  const handleSuccess = () => {
    router.push('/admin/recurring-events')
    router.refresh()
  }

  if (!clubs || clubs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">No clubs found</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4">
        <Link
          href="/admin/recurring-events"
          className="flex items-center text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Recurring Events
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create Recurring Event</h1>
      </div>

      <div className="mb-6">
        <label htmlFor="club-select" className="block text-sm font-medium mb-2">
          Club
        </label>
        <select
          id="club-select"
          value={selectedClubId}
          onChange={(e) => setSelectedClubId(e.target.value)}
          className="border rounded px-3 py-2"
        >
          {clubs.map((club) => (
            <option key={club.id} value={club.id}>
              {club.name}
            </option>
          ))}
        </select>
      </div>

      {selectedClubId && (
        <RecurringEventForm
          mode="create"
          clubId={selectedClubId}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}
```

**Step 3: Create edit page**

Create `src/app/[locale]/admin/recurring-events/[id]/edit/page.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRecurringEvent } from '@/lib/hooks/use-recurring-events'
import { RecurringEventForm } from '@/components/admin/recurring-event-form'

export default function EditRecurringEventPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const [id, setId] = useState<string | null>(null)

  useEffect(() => {
    params.then((resolved) => setId(resolved.id))
  }, [params])

  const { data: event, isLoading, error } = useRecurringEvent(id || '')

  const handleSuccess = () => {
    router.push('/admin/recurring-events')
    router.refresh()
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (error || !event) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">Recurring event not found</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4">
        <Link
          href="/admin/recurring-events"
          className="flex items-center text-text-secondary hover:text-text-primary"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Recurring Events
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Edit Recurring Event</h1>
      </div>

      <RecurringEventForm
        mode="edit"
        clubId={event.clubId}
        initialData={event}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
```

**Step 4: Commit**

```bash
git add src/app/[locale]/admin/recurring-events/page.tsx src/app/[locale]/admin/recurring-events/new/page.tsx src/app/[locale]/admin/recurring-events/[id]/edit/page.tsx
git commit -m "feat: add recurring events admin pages"
```

---

## Task 20: Add Recurring Events to Admin Navigation

**Files:**

- Modify: `src/components/admin/sidebar.tsx`
- Modify: `src/components/admin/sidebar.test.tsx`

**Step 1: Update sidebar with recurring events link**

Modify `src/components/admin/sidebar.tsx`:

```typescript
// Add to navigation items array
{
  label: 'Recurring Events',
  href: '/admin/recurring-events',
  icon: Repeat, // Import from lucide-react
}
```

**Step 2: Update sidebar test**

Add to `src/components/admin/sidebar.test.tsx`:

```typescript
it('renders recurring events link', () => {
  render(<Sidebar />)
  expect(screen.getByText(/recurring events/i)).toBeInTheDocument()
})
```

**Step 3: Run test to verify it passes**

```bash
npm test src/components/admin/sidebar.test.tsx
```

Expected: PASS

**Step 4: Commit**

```bash
git add src/components/admin/sidebar.tsx src/components/admin/sidebar.test.tsx
git commit -m "feat: add recurring events to admin nav"
```

---

## Task 21: Add Translations

**Files:**

- Modify: `messages/en.json`
- Modify: `messages/fr.json`

**Step 1: Add English translations**

Add to `messages/en.json`:

```json
{
  "admin": {
    "recurringEvents": {
      "title": "Recurring Events",
      "create": "Create Pattern",
      "edit": "Edit Pattern",
      "confirmDelete": "Delete this recurring event? All future occurrences will be removed.",
      "paused": "Paused",
      "frequency": "Frequency",
      "weekly": "Weekly",
      "biweekly": "Biweekly (every 2 weeks)",
      "monthly": "Monthly",
      "days": "Days",
      "time": "Time",
      "nextOccurrences": "Next occurrences:",
      "noUpcoming": "No upcoming occurrences",
      "invalidPattern": "Invalid recurrence pattern"
    }
  }
}
```

**Step 2: Add French translations**

Add to `messages/fr.json`:

```json
{
  "admin": {
    "recurringEvents": {
      "title": "Événements récurrents",
      "create": "Créer un modèle",
      "edit": "Modifier le modèle",
      "confirmDelete": "Supprimer cet événement récurrent? Toutes les occurrences futures seront supprimées.",
      "paused": "En pause",
      "frequency": "Fréquence",
      "weekly": "Hebdomadaire",
      "biweekly": "Aux deux semaines",
      "monthly": "Mensuel",
      "days": "Jours",
      "time": "Heure",
      "nextOccurrences": "Prochaines occurrences:",
      "noUpcoming": "Aucune occurrence à venir",
      "invalidPattern": "Modèle de récurrence invalide"
    }
  }
}
```

**Step 3: Commit**

```bash
git add messages/en.json messages/fr.json
git commit -m "feat: add recurring events translations"
```

---

## Task 22: Run All Tests and Quality Gates

**Files:**

- All

**Step 1: Run full test suite**

```bash
npm run test -- --coverage
```

Expected: PASS with ≥95% coverage

**Step 2: Run typecheck**

```bash
npx tsc --noEmit
```

Expected: No type errors

**Step 3: Run linter**

```bash
npm run lint
```

Expected: No lint errors

**Step 4: Run prettier**

```bash
npx prettier --write .
```

Expected: All files formatted

**Step 5: Commit any formatting changes**

```bash
git add -A
git commit -m "chore: format code with prettier"
```

---

## Task 23: Manual Testing

**Step 1: Start dev server**

```bash
npm run dev
```

Expected: Server starts on configured port

**Step 2: Navigate to recurring events admin**

Visit: `http://localhost:[PORT]/admin/recurring-events`

Expected: List page loads, shows club selector

**Step 3: Create recurring event**

- Click "Create Pattern"
- Fill form: Title, Address, select days, time
- Verify occurrence preview shows correct dates
- Click "Create"

Expected: Redirects to list, new pattern appears

**Step 4: Verify hybrid query**

- Navigate to homepage events list
- Verify both materialized and virtual events appear

Expected: Events from patterns show in list

**Step 5: Test cron endpoint (manual trigger)**

```bash
curl -X POST http://localhost:[PORT]/api/cron/materialize-events
```

Expected: Returns JSON with processed/created counts

---

## Completion Checklist

- [ ] Task 1: Install rrule
- [ ] Task 2-4: RRule utilities with tests
- [ ] Task 5: Zod schemas
- [ ] Task 6-7: Materialization service
- [ ] Task 8-9: Hybrid query service
- [ ] Task 10: CRUD service functions
- [ ] Task 11: Update events service
- [ ] Task 12: Cron API route
- [ ] Task 13: Vercel cron config
- [ ] Task 14: RecurringEvent API routes
- [ ] Task 15: React Query hooks
- [ ] Task 16: RecurrenceBuilder component
- [ ] Task 17: OccurrencePreview component
- [ ] Task 18: RecurringEventForm component
- [ ] Task 19: Admin pages (list/create/edit)
- [ ] Task 20: Add to admin navigation
- [ ] Task 21: Translations
- [ ] Task 22: Quality gates (tests, lint, typecheck)
- [ ] Task 23: Manual testing

## Notes

- All tests use real test database (never mock Prisma)
- TDD flow strictly enforced: test → fail → implement → pass → commit
- Hybrid query enables both fast near-term queries and flexible long-term display
- Weekly materialization keeps DB lean while providing good UX
- Phase 3.5 (edit individual occurrences) deferred to separate branch
