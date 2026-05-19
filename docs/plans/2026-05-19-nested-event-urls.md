# Nested event URLs: `/clubs/{club}/events/{slug}/{date}`

**Status**: design + implementation plan, awaiting review before code lands.
**Origin**: discussion on PR #35 about ugly globally-unique event slugs (`faux-mouvement-mardi`, `club-la-foulee-longue-sortie-dimanche`).

## Decisions (pinned upstream)

- **URL shape**: `/clubs/{club}/events/{slug}/{YYYY-MM-DD}` for a specific occurrence. Bare `/clubs/{club}/events/{slug}` redirects to next upcoming occurrence.
- **Slug**: single language-agnostic value, auto-filled from title via `createSlug`, user-editable in the creation form, unique **within the club's namespace** (not globally).
- **Materialization**: virtual by default. Concrete `Event` row only created when an occurrence deviates from the pattern (cancellation, location/time override). URL shape is the same for virtual and concrete — the data layer hides the difference.

## Weakest part first

Migration. We have live URLs, internal links, sitemap entries, and tests pointing at `/events/{slug}--{date}` and `/events/{cuid}:{date}`. Breaking them mid-flight is the failure mode that hurts most. The plan must ship redirects in the same PR as the new routes, and keep them indefinitely (low maintenance cost, real SEO value).

Secondary risk: per-club slug uniqueness is a schema change (drop global `@unique`, add `@@unique([clubId, slug])`). One Prisma migration, easy. The risk is forgetting to backfill — must regenerate all existing event slugs in the same migration.

## Schema change

```diff
 model RecurringEvent {
   id          String  @id @default(cuid())
-  slug        String  @unique
+  slug        String
   title       String
   ...
   clubId      String

+  @@unique([clubId, slug])
   @@map("recurring_events")
 }
```

One migration file. No data shape changes — only the constraint surface moves.

## Slug regeneration

After the constraint flips, regenerate all 14 existing event slugs to drop the club prefix:

| Club                    | Old slug                                      | New slug                             |
| ----------------------- | --------------------------------------------- | ------------------------------------ |
| Faux Mouvement × 3      | `faux-mouvement-mardi` / `jeudi` / `dimanche` | `mardi` / `jeudi` / `dimanche`       |
| Les Citrons Pressés × 2 | `les-citrons-presses-lundi` / `mercredi`      | `lundi` / `mercredi`                 |
| La Panthère × 2         | `la-panthere-mercredi` / `samedi`             | `mercredi` / `samedi`                |
| Volt × 2                | `volt-lundi` / `mercredi`                     | `lundi` / `mercredi`                 |
| Le Coureur Nordique     | `le-coureur-nordique`                         | `mardi`                              |
| Club La Foulée          | `club-la-foulee-intervalles`                  | `intervalles-mardi`                  |
| Club La Foulée          | `club-la-foulee-longue-sortie`                | `longue-sortie-dimanche`             |
| Milaprès1000            | `milapres1000`                                | `mardi`                              |
| 6AM Club × 16           | `6am-club-limoilou`, etc.                     | `limoilou`, `beauport`, `sillery`, … |

Per-club uniqueness verified in the migration script — if any club has duplicates (shouldn't, but worth checking), the script halts.

## Route changes (Next 15 App Router)

New files:

- `src/app/[locale]/clubs/[slug]/events/[eventSlug]/[date]/page.tsx` — specific occurrence page. Renders virtual event or materialized concrete event uniformly.
- `src/app/[locale]/clubs/[slug]/events/[eventSlug]/page.tsx` — server-side compute next occurrence date from rrule, `redirect()` to `[date]` segment.

Modified:

- `src/app/[locale]/events/[id]/page.tsx` — change from rendering to a redirect. Parse the old shape (`slug--date`, `cuid:date`, bare `cuid`) and resolve to the new nested URL. Keep indefinitely as a redirect.
- All EventCard / link components — point to nested URL. They already receive `event.club: { slug }` via the existing includes, so the data is there.

## Service layer changes

- `getEventById` (today resolves both virtual and concrete) gains a sibling `getEventByClubAndSlug({ clubSlug, eventSlug, date })`. The two coexist while we drain the legacy URL surface; `getEventById` is callable from the legacy redirect route.
- Resolution order inside the new helper:
  1. Look up `RecurringEvent` by `(clubSlug, eventSlug)` join.
  2. If a concrete `Event` exists with matching `recurringEventId` + `date`, return it (handles overrides).
  3. Otherwise build a virtual event from the pattern + the requested date. Reject dates not produced by the rrule (404).

## Implementation order (one PR, 7 small commits)

1. **Migration**: schema change + slug regeneration script. Run locally; verify all events still resolvable.
2. **Service**: add `getEventByClubAndSlug` with unit tests. Existing `getEventById` untouched.
3. **New routes**: add `[eventSlug]/[date]/page.tsx` + bare `[eventSlug]/page.tsx` (with redirect). Render same content as legacy `/events/[id]`.
4. **Link rewrites**: update every internal `<Link href="/events/...">` to nested form. Run tests; e2e probably catches anything missed.
5. **Legacy redirect**: rewrite `/events/[id]/page.tsx` to a `redirect()` call. Cover the 3 legacy shapes (slug--date, cuid:date, bare cuid).
6. **Seed update**: regen `prisma/seed.ts` so its event entries use the new slug values (so future re-seeds stay aligned).
7. **Sitemap + tests**: update sitemap.xml if applicable. Update or add e2e covering nested URL + legacy redirect.

## Materialization policy (data layer)

Already supported by current schema: `Event` model has `recurringEventId` link and `EventStatus` (SCHEDULED/CANCELLED). No schema work needed for this plan. To make it useful, follow-up PRs will:

- Add admin UI for "cancel this date" (creates `Event` row with `status: CANCELLED` linked to the recurring pattern).
- Add admin UI for "override this date" (creates `Event` row with overridden fields, same recurringEventId/date).
- Read path stays the same: when computing virtual events, first check if a concrete `Event` exists for that pattern+date; if so, render it instead of the virtual one (or skip entirely if CANCELLED).

That work is **out of scope here**. The URL refactor lays the foundation; the override UX is a separate PR.

## Out of scope

- Admin form for editing event slugs (the auto-fill UX). Will land with the broader recurring-event admin polish.
- Materialization UX (cancellation, override). Separate PR; data model already supports it.
- Bare `/events` index page reshape (still useful — cross-club timeline of upcoming runs).
- `i18n` of slugs. Decided: single language-agnostic slug.

## Risks

- **Stale internal links**: a missed link rewrite in step 4 would 404 against the new routes. Mitigation: grep for `'/events/'` after rewrites; e2e covers the main flows.
- **Legacy URL drift**: someone bookmarks `/events/faux-mouvement-mardi--2026-05-19`. With the redirect in place they're fine. Without it, 404. The redirect MUST land in the same PR.
- **Slug collisions on regeneration**: two events under the same club with the same proposed new slug. Vanishingly unlikely with today's data, but the migration script must abort hard rather than silently drop. Add an assert.
- **Schema migration on prod**: `prisma migrate deploy` runs as part of deploy. The slug regeneration is a data migration that must run alongside the schema migration. Wire as a Prisma migration `.sql` with the regeneration in the same transaction, OR a one-shot script invoked from the deploy pipeline. Prefer the first.

## Definition of done

- `/clubs/faux-mouvement/events/mardi/2026-05-26` renders the same event the old URL renders today.
- `/clubs/faux-mouvement/events/mardi` redirects to the next upcoming occurrence.
- `/events/faux-mouvement-mardi--2026-05-19` 301-redirects to the nested URL.
- `/events/{cuid}:{date}` (legacy) 301-redirects too.
- Schema migration applied; no event slugs include their club prefix anymore.
- Internal links all point at the nested URL (grep clean).
- E2E covers: nested URL renders, bare-slug redirects, legacy URL redirects.
- 689 → ≥689 tests passing; coverage ≥95%; lint + tsc clean.

## Open questions for review

1. **Date format**: `YYYY-MM-DD` (ISO, default in this plan) vs `2026/05/26` (path-segment style). ISO wins on shareability and parseability; `/` requires URL encoding awareness. Keeping ISO.
2. **Trailing date redirect**: `/clubs/{club}/events/{slug}/{past-date}` — show the past event (read-only), or redirect to next occurrence? **Suggest**: render past events with a `Past` badge. Useful for "remember last week's run" links. Easy to reverse later.
3. **Slug freedom in admin form**: full ASCII slug regex `[a-z0-9-]+` minimum, or also allow accented chars (`intervalles-libérés`)? Accented chars look better but break copy-paste in some terminals. **Suggest**: ASCII only for now, with `createSlug` auto-normalizing on save.
