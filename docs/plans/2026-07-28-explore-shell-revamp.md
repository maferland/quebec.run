# Explore shell revamp

The locale-switch 404 is fixed (commit `fd77348`). This plan covers the code-quality work
behind it: `explore-shell.tsx` was 1121 lines with no tests, and the data layer was three
hand-rolled caches that React Query already solves.

All six PRs have landed. `explore-shell.tsx` is 572 lines, the explore tree has 25 new
unit tests, and three bugs surfaced along the way (listed at the end, plus the sheet-drag
one fixed in PR 5).

## What's actually wrong

Measured, not guessed.

| Symptom                                    | Evidence                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| One component holds the whole feature      | `explore-shell.tsx`: 1121 lines, 18 `useRef`, 20 `useState`, 15 `useEffect`, 21 `useCallback`, 10 `useMemo`                                                                                                                                                                                                                 |
| Panel routing is a ref-based state machine | 9 refs (`hydratedRef`, `pendingCloseRef`, `pendingOpenRef`, `closingDetailKeyRef`, `detailHistoryRef`, `pendingDetailBackRef`, `pendingDetailBackCloseModeRef`, `exitFallbackRef`, `enterFallbackRef`) driven by one 76-line effect (`explore-shell.tsx:241-316`) with 8 deps that reads and writes the state it depends on |
| Three parallel fetch layers                | raw `fetch` + `useState` + `AbortController` for week-counts/runs/clubs; a `runsByDayRef` Map; a module-level promise cache in `detail-panel.tsx:20-54`                                                                                                                                                                     |
| Detail overlays duplicated                 | `RunDetailOverlay` and `ClubDetailOverlay` share ~120 lines of identical fetch/error/skeleton/animation scaffolding (`detail-panel.tsx:340-587`)                                                                                                                                                                            |
| i18n bypassed in the error path            | `DetailError` hardcodes `french ? 'Réessayer' : 'Retry'` and `'la sortie'` / `'le club'` (`detail-panel.tsx:269-324`)                                                                                                                                                                                                       |
| Translation keys lose their types          | `tr = (k) => t(k as Parameters<typeof t>[0])` cast, then drilled through 11 components                                                                                                                                                                                                                                      |
| Prop explosion                             | `RunList` takes 22 props, `ExploreControls` 16 (including a `searchInputRef`)                                                                                                                                                                                                                                               |
| Coverage gate is inert                     | `vitest.config.ts` uses the Vitest 0.x `thresholds: { global: {...} }` shape. Actual coverage: **48.62% statements**, and the run exits 0                                                                                                                                                                                   |
| Dead code                                  | `src/components/ui/language-switcher.tsx` has zero imports (and a 🇺🇸 flag for English); `Providers` in `src/app/providers.tsx` is a passthrough that returns `children`                                                                                                                                                     |
| React Query installed but unused here      | `ExploreProviders` only supplies `ThemeProvider`; no `QueryClientProvider` in the explore tree                                                                                                                                                                                                                              |

## PR stack

Each PR is independently shippable and keeps the app green.

### PR 1 — locale-switch fix (done, `fd77348`)

Deleted the inert `@modal` interception slot. `e2e/locale-switch.spec.ts` fails 4/4
against a production build with the slot present, passes 8/8 without it.

### PR 2 — React Query for explore data (done, 264 lines removed net)

`QueryClientProvider` added to `ExploreProviders`. New `src/lib/hooks/use-explore.ts`,
following the existing `src/lib/hooks/use-*.ts` convention:

- `useWeekCounts()`, `useExploreRuns({ day })` (SSR payload as `initialData`),
  `useExploreClubs()`
- `useRunDetail(id)`, `useClubDetail(slug, locale)` replacing the promise-Map cache
- `useDetailPrefetch(locale)` wrapping `queryClient.prefetchQuery` for the hover preload
- `exploreKeys` key factory, per the frontend rules

Deleted `runsByDayRef`, `initialRunsDayRef`, `loadingRuns`, `loadingClubs`, both
`AbortController` blocks, the `selectedRunPoint` state and its effect, `cacheRequest`, and
both module-level `Map`s. The two detail overlays now share one `OverlayShell` and one
`useOverlay` hook. `DetailError` reads real `explore.detail_error_*` message keys instead
of `french ? … : …`.

Fixed a real leak on the way: the old club cache keyed on `locale:slug` and never
invalidated, so a long session accumulated every club in both locales. React Query's
`gcTime` now bounds it.

Response normalisation moved across verbatim. Replacing the all-optional
`RunDetailResponse` and its `??` fallbacks with a Zod schema is a separate correctness
change (the run detail API returns a union of a virtual and a Prisma event), tracked as a
follow-up rather than folded in here.

### PR 3 — extract the panel state machine (done, `06933b6`)

`useDetailRoute` owns the 9 refs and the 76-line effect, returning `overlay`,
`previousOverlay`, `openDetail`, `requestExit`, `completeEnter` and `completeExit`. The
shell passes a `buildFallbackPath` callback so the hook stays unaware of day, filters and
locale. 14 unit tests, the first this machinery has had.

### PR 4 — drop the `tr` prop (done, `7dcd41a`)

15 components call `useTranslations('explore')` directly, which restores next-intl's key
checking across the subtree. Two hacks went with it: a "see N more" label that
string-compared translated output against the French literal to pick a language, and a
sibling that used `label.startsWith('explore.')` to sniff a missing key. Both replaced by
a `see_more_count` message with a `{count}` param.

### PR 5 — split the shell (done, `d039aba`)

`useExploreUrlState`, `useContainerMetrics`, `useNowMinutes`, `useSheetDrag`,
`useExploreSearch`, `useAutoScrollToNextRun`, plus `DesktopRail`, `MobileSheet` and
`DetailPanelSlot`. The last collapses four near-identical JSX blocks into one branch on
`overlay.kind`.

Fixed a bug the split exposed: the mobile sheet snapped back to its middle position after
every drag, because the recentring effect was keyed on `dragging` and fired right after
`onPointerUp` had chosen a snap point. 506px to 785px now, 506px to 506px before.

### PR 6 — dead code and the coverage gate (done)

Deleted `language-switcher.tsx` (zero imports) and the no-op `Providers` passthrough.

The threshold shape is fixed and the gate is now proven to fire: a deliberately narrow
run exits 1 with `ERROR: Coverage for statements (0.57%) does not meet global threshold
(50%)`. Before, 48.62% against a nominal 95% exited 0.

Ratchet set at today's honest numbers — 50% statements and lines, 78% branches, 72%
functions — with `scripts/**`, `.storybook/**` and the `src/lib/test-*` helpers excluded
so the number reflects shipped code. `CLAUDE.md` updated to describe the ratchet instead
of a 95% gate that never ran.

## Found but not folded in

Both are behaviour changes rather than refactors, so they want their own PR and their own
review.

1. **Search is accent-sensitive.** Typing `panthere` finds nothing; the club is
   `La Panthère`. For a French-first app where people rarely type accents, that is a real
   usability bug. Fix is to normalise both sides with
   `String.prototype.normalize('NFD')` before comparing.
2. **Upcoming-run dates render in English on the French club page** — `Wed, Jul 29` under
   `Prochaines sorties`. `formatUpcomingDate` in `club-detail.tsx` does not take a locale.
3. **The run detail response is a union.** `/api/explore/runs/[id]` returns either a
   virtual event or a Prisma event, with different club shapes, which is why the client
   type is all-optional with `??` fallbacks on every field. A Zod schema at that boundary
   would let the fallbacks go.

## Decisions

- **Ship as the 5-PR stack**, not one branch.
- **Styling stays as-is.** Inline `style={{}}` and CSS vars move with the components they
  belong to. No Tailwind conversion, no `qr-*` migration. Revisit separately with
  Chromatic diffs if it's still worth doing afterwards.
- **Detail panels keep `DetailSkeleton` / `DetailError`**, driven by `isPending` and
  `isError`. No Suspense: the enter/exit animation needs the shell element to stay
  mounted across the load.
- **Coverage gate gets fixed and ratcheted** from today's real number rather than jumping
  to 95%. Each PR in the stack raises it.
