# Pagination across list pages

**Why now**: pinpoint review on PR #35 flagged 4 of 6 list-style pages as overwhelming on mobile (home featured clubs, /clubs, /clubs/:slug events, /events). Long unbroken scrolls hurt skimming and orientation. Calendar is already date-grouped, so it's lower priority.

## Weakest part first

Three obvious options:

- **Classic numbered pages** — discoverable, shareable URLs, but every click is a server round-trip. Awkward for "I want to see today + tomorrow".
- **Infinite scroll** — bad for footers (user never reaches them) and for the calendar/events use case where users compare across dates.
- **Load more button** — keeps URL stable, footer reachable, no surprise data loads, plays well with server components.

**Recommendation: load-more button**. Defaults short (≈8 clubs, ≈10 events), one tap to expand. URL stays stable for shareability. Footer still reachable.

Caveat: load-more behind a client component cuts off Next 15 server-component caching. Acceptable tradeoff — initial page is fast, "more" is a deliberate user action.

## Scope (one PR, four surfaces)

| Page                  | Today                                             | Target                                                                                                                |
| --------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `/` featured clubs    | `slice(0, 6)` hard-coded                          | First 6 visible, "View all clubs →" already exists; no pagination needed. **Cut from scope** unless audit comes back. |
| `/clubs`              | renders **all 13** clubs                          | Show 8, "Load 5 more" button. Keep order alphabetical.                                                                |
| `/clubs/:slug` events | renders **all 30 days** of events                 | Show 7 days (next week), "Load next week" button.                                                                     |
| `/events`             | renders **all upcoming** events (grouped by date) | Show first **3 days** of groups, "Load more dates" button.                                                            |

## Implementation sketch

1. **Client `<LoadMoreList>` wrapper** in `src/components/ui/load-more-list.tsx`:
   - Props: `items: T[]`, `initial: number`, `step: number`, `renderItem: (t: T) => ReactNode`, `groupBy?: (t: T) => string`.
   - Internal `visible` state, increments by `step` on click.
   - Renders flat list OR grouped (when `groupBy` provided — used by `/events`).
2. **i18n**: `common.loadMore: "Load {n} more"` and FR equivalent — handles plural.
3. **No data layer changes**. Server still returns the full list; the gate is purely client-side rendering. Move to server-paginated only if dataset grows past ~100.
4. **No tests for the button mechanics**; one test per page asserting "initially shows N, after click shows N+step".

## Out of scope

- Server-side pagination — premature with 13 clubs and ~50 weekly events.
- Filters (type/vibe/pace) — separate PR; combine with pagination only if filters reduce list below the load-more threshold (then hide the button).
- Skeleton states for "load more" — instant client render, no need.

## Risks

- Click + scroll-jump UX: when "Load more" injects below the button, focus stays put — fine. If we move the button to the bottom of new items instead, scroll feels nicer but adds complexity. **Start with button stays put.**
- SEO: only the first page is server-rendered. The "more" items aren't crawled. Acceptable — clubs and events have their own detail pages with full content.

## Definition of done

- `/clubs`, `/clubs/:slug` (events), `/events` all use `LoadMoreList`.
- Click reveals next chunk; button disappears at end.
- One Playwright e2e: visit /clubs, count cards, click load-more, count grows.
- Lint/tsc/test all green; coverage ≥95%.
