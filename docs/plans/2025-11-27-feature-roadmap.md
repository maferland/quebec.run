# Feature Roadmap - Next Priorities

**Status:** Planning
**Created:** 2025-11-27

## Overview

Four features to implement incrementally, one at a time. Each builds on existing schema foundations (RecurringEvent, Strava fields, Leaflet installed).

---

## 1. Auth UI Improvement

**Scope:** Custom branded sign-in page replacing NextAuth defaults

**Current State:**

- NextAuth with passwordless email (Resend/Mailhog)
- Default NextAuth UI at `/api/auth/signin`
- Auth flow works, just needs branding

**What to build:**

- Custom sign-in page with project branding
- Better UX for email input + verification state
- Keep existing auth flow unchanged

**Complexity:** Low
**Priority:** First (foundation UX)

---

## 2. Map Markers (Events Only)

**Scope:** Interactive Leaflet map showing event locations

**Current State:**

- Leaflet + react-leaflet installed
- Events have lat/long fields (optional)
- No map UI yet

**What to build:**

- Interactive map on homepage/events page
- Event markers clustered for dense areas
- Click marker → event details popup
- Handle events without coordinates gracefully

**Complexity:** Moderate
**Priority:** Second (core discovery feature)

---

## 3. Recurring Events

**Scope:** Admin UI + generation logic for repeating events

**Current State:**

- RecurringEvent model exists with schedulePattern, timezone, generateUntil
- No UI or generation logic

**What to build:**

- Admin UI to create/edit recurring patterns (weekly/biweekly common)
- Generation logic to create Event records from RecurringEvent schedule
- Cron job runs periodically to generate events X days ahead
- MVP: edit affects whole series, not individual instances

**Complexity:** High
**Priority:** Third (enables clubs to automate event posting)

**Technical decisions needed:**

- Schedule format (cron? rrule? custom DSL?)
- How far ahead to generate events (30/60/90 days?)
- Cron provider (Vercel Cron? external service?)

---

## 4. Strava Integration

**Scope:** Pull Strava group events into our Event model

**Current State:**

- Club model has stravaClubId, stravaSlug, isManual, lastSynced fields
- No OAuth flow or sync logic

**What to build:**

- OAuth flow for club owners to link Strava club
- Pull Strava group events into Event model
- Scheduled job syncs weekly to catch new Strava events
- Mark Strava-sourced events as `isManual=false` to prevent conflicts
- UI shows Strava-linked badge on clubs

**Complexity:** High
**Priority:** Fourth (enables automatic sync from existing Strava clubs)

**Technical decisions needed:**

- OAuth provider setup (Strava app registration)
- Which Strava API endpoints to use
- Conflict resolution strategy (Strava vs manual events)
- How to handle deleted Strava events

---

## Implementation Approach

Work one feature at a time. Each gets:

1. Design document (this file for planning, separate doc per feature)
2. Worktree for isolated development
3. Implementation with tests
4. PR with review

After each feature ships, move to next.
