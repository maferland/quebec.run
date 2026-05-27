# Code quality audit — findings + plan

Audit run across the whole codebase (not just recent additions). 20 findings, sliced by severity. Each is a small shippable fix — no architecture rewrites.

## CRITICAL — missing authorization (3)

1. `src/app/api/recurring-events/route.ts:24-26` — POST missing club-ownership check (TODO comment in place).
2. `src/app/api/recurring-events/[id]/route.ts:31-33` — PUT missing ownership check.
3. `src/app/api/recurring-events/[id]/route.ts:41-43` — DELETE missing ownership check.

**Risk:** any authenticated user can create / update / delete recurring events on any club, not just their own.
**Fix:** before the service call, `await prisma.club.findUnique({where:{id: data.clubId}, select:{ownerId:true}})` and reject if `club.ownerId !== user.id && !user.isStaff`.
**PR:** PR-A — ship first, in isolation.

## HIGH (4)

4. `src/lib/services/clubs.ts` lines 130, 155, 225, 249, 358, 362 — 6 raw `throw new Error('...')` calls. The events service uses typed `NotFoundError` / `UnauthorizedError` from `@/lib/errors` — clubs should too.
5. `src/app/[locale]/calendar/page.tsx:31-46` — query params bypass Zod (manual `as` casts). `/events` and `/clubs` use schema validation. Calendar should too. Need to bump `paginationQuerySchema.limit.max` or pass `limit` outside the schema.
6. `src/lib/services/events.ts` — `resolveClubIdFromSlug` logic duplicated 3 times (lines ~33-38, 347-354, 389-396). Extract a private helper.
7. `prisma/schema.prisma` — missing indexes on `Event.clubId`, `Event.recurringEventId`, `RecurringEvent.clubId`. These are in WHERE clauses on every event listing call. Add `@@index([clubId])` etc. Requires a migration.

**PR:** PR-B — services + schema cleanup.

## MEDIUM (8)

8. `src/components/filters/facet-combobox.tsx:72-73` — `(t as any)` cast to bypass next-intl narrow typing. Replace with `// @ts-expect-error` and a comment, or write a tiny typed wrapper.
9. `src/components/events/event-location-card.tsx:16` — `WEEKDAY_ORDER` duplicates the constant in events service. Re-export from service or extract to `@/lib/utils/date`.
10. `src/lib/services/events.ts:402-410` — `getCalendarListing` facet loop duplicates the events listing one. Extract a `countByFacet<TKey, TParam>(events, data, facets, matchesFn)` helper used by both.
11. `src/components/admin/address-list.tsx:92` — hardcoded `Hide` / `Show` strings.
12. `src/components/ui/user-dropdown.tsx:76` — hardcoded `Privacy Settings` link label.
13. `src/app/api/cron/materialize-events/route.ts:12` — `console.log` leftover from dev. Drop or pipe to structured logger.
14. `src/lib/auth.ts:~36` — email send error swallowed via `console.error`. Surface a typed error to the caller.
15. `e2e/screenshots.spec.ts:22, 39, 49, 82, ...` — `page.waitForTimeout(2000) + .catch(() => {})` pattern. Replace with role-based waits.

**PR:** PR-C — visible polish + i18n.

## LOW (5)

16. `prisma/seed.ts:217` — unused `leCrew` variable. Inline the create or delete the binding.
17. `EMPTY_FACET_COUNTS` (events.ts:151-160) + `EMPTY_CLUB_FACET_COUNTS` (clubs.ts:66-72) — both manually spell out zero objects. Move to `@/lib/facets` as `createEmptyFacetCounts<K>(facets)`.
18. Magic number `60` (days lookahead) appears 4 times in events.ts. Lift to `const DEFAULT_LOOKAHEAD_DAYS = 60`.
19. `use-events.ts:10-26` + `use-clubs.ts:12-27` — manual URLSearchParams construction. Tiny `buildFetchUrl(base, params)` helper.
20. `use-auth-guard.ts:17-24` — `options?.skip` not in deps. Destructure outside the useEffect.

**PR:** PR-D — bulk LOW cleanup; can also fold into PR-C if velocity matters more than blast radius.

## Things explicitly NOT in scope here

- Architecture rewrites of any kind (service layer split, separating reads from writes, switching to tRPC, etc.).
- Schema redesign (e.g., decomposing virtual events into a separate table).
- Test framework changes (Vitest → Jest, MSW upgrades, etc.).
- The recurring-event rrule tz bug — separate plan/issue.
- Typeahead / fuzzy match in the combobox — separate follow-up.

## PR order

PR-A (critical security) → PR-B (services + schema) → PR-C (polish + i18n) → PR-D (low cleanup).

PR-A ships immediately. Others can land in any order after that.
