# Handoff — map popup variant pick (PR #56)

**Branch:** `maferland/audit-leftovers` · **PR:** [#56](https://github.com/maferland/quebec.run/pull/56)
**Last shipped commit:** `b9a887c` (Variant A — committed + pushed)
**Working tree (uncommitted on top):** Variant E in `src/components/map/event-map-content.tsx` + Leaflet chrome tightening in `src/app/globals.css`

## Where to start

User went through 8+ pinpoint rounds on the multi-event map popup. Last message before context cut:

> "not sure I like this better, try showing me 5 variants"

5 variants were generated. Screenshots captured. User did not pick before the session ended. **First task: render the variants in dev, run pinpoint, ask user to pick, then implement the final choice on top of `b9a887c`.**

## The 5 variants

Screenshots live in `docs/handoff/popup-variants/`.

### Variant A — pink Tag pill stack (CURRENTLY ON `main` of branch, commit `b9a887c`)

Pink `Tag variant="datetime"` pill per event with `Clock` icon + `ChevronRight` inside. Sized to widest via `grid justify-start gap-y-1`. Matches the brand pink pill used on event cards.

No screenshot saved — git checkout `b9a887c` and load the page to see it.

### Variant B — left-border primary cards

`docs/handoff/popup-variants/popup-variant-B.png`

Each row is `border-l-4 border-primary pl-2 py-1`, event title h3 + date+time subtitle. Mirrors `RecurringPatternCard` mini-layout.

### Variant C — two-column row

`docs/handoff/popup-variants/popup-variant-C.png`

Uppercase weekday label (`w-14`) on the left, pink Tag pill on the right. Full-row clickable.

### Variant D — "X prochaines courses" header + pill flex-wrap

`docs/handoff/popup-variants/popup-variant-D.png`

Secondary uppercase eyebrow ("X prochaines courses"), then pink Tag pills in `flex flex-wrap gap-1.5`.

### Variant E — big day number + chevron card (CURRENTLY IN WORKING TREE, uncommitted)

`docs/handoff/popup-variants/popup-variant-E.png`

Bordered card per row, big day-of-month number on the left (`font-bold text-primary text-base tabular-nums`), weekday uppercase + time stacked, `ChevronRight` outside on the right.

## Constraints from prior feedback

- Pink pill is the brand visual language. Don't drop it without a strong reason — V5–V7 lost it and the user pushed back hard: _"the events read as time only and are disjointed from the visual language used by the rest of the app"_.
- Title→address gap is `mb-1`, not `mb-3`. Tight spacing the whole way down.
- Pills sized to widest pill (use `grid` or explicit width), NOT full-width.
- Chevron lives inside the pill at the right edge (Variant A) — that was approved.
- Address only renders when it differs from the event title (the new Variant E header check `head.club.name !== head.title` is also worth keeping).

## Reference files

- `src/components/map/event-map-content.tsx` — popup component, all variants edit this file
- `src/components/clubs/recurring-pattern-card.tsx` — visual-language reference (left-border primary card)
- `src/components/ui/tag.tsx` — `variant="datetime"` is the pink pill
- `src/lib/utils/group-by-location.ts` — dedupe util (committed, don't touch)
- `src/lib/utils/group-by-location.test.ts` — 4 tests, all passing

## TODO for next agent

- [ ] `git diff` — confirm working tree holds Variant E + globals.css tweak
- [ ] Decide: keep WIP commit or revert working tree to `b9a887c` before re-running pinpoint
- [ ] Render each variant in dev (swap the JSX block per variant — keep diffs in scratch branches if needed)
- [ ] Take fresh screenshots at desktop + mobile for each
- [ ] Run pinpoint via `Bash(pinpoint review …)` with all variant screenshots
- [ ] Ask the user to pick (numbered annotation on the chosen variant)
- [ ] Implement the chosen variant on top of `b9a887c` (or `HEAD` if WIP was kept)
- [ ] Drop Variant E + `globals.css` chrome tweak if they're not part of the final pick
- [ ] Quality gates: `npm run lint && bun tsc --noEmit && npm run test -- --coverage && npx prettier --write .`
- [ ] Pinpoint pass on the final pick
- [ ] Update PR #56 description with the final design choice + screenshot
- [ ] Mark PR ready for review

## Worktree details

- Path: `/Users/marc-antoine.ferland/dev/quebec.run/.worktrees/audit-leftovers`
- DB: `quebec.run_audit-leftovers`
- Dev port: `60XX` (check `npm run worktree:info` or scripts)
- Bring up dev: `bun run scripts/dev.ts` from inside the worktree

## What's already shipped on this branch

- `c15071f` — marker dedupe (`groupByLocation` util + 4 tests) + audit cleanup leftovers (`createEmptyFacetCounts`, `buildFetchUrl`, `EmailSendError`, `use-auth-guard` deps, `e2e/screenshots.spec.ts` `settle()` helper)
- `b9a887c` — Variant A popup styling (chevron inside pill, tighter row spacing)

PR #56 is open against `main`. Do not merge until popup design is locked.
