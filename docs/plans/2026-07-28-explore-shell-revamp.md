# Explore shell revamp

The locale-switch 404 is fixed (commit `fd77348`). This plan covers the code-quality
work behind it: `explore-shell.tsx` is 1121 lines with no tests, and the data layer is
three hand-rolled caches that React Query already solves.

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

### PR 3 — extract the panel state machine

`useDetailRoute()` owns the 9 refs and the 76-line effect, returning
`{ current, previous, open, close }`. Collapse the two overlays into one `DetailOverlay`
taking a `detail: DetailRoute`. This is the first code in the feature to get unit tests:
open, close-to-route, close-to-history, detail-to-detail push, and back.

### PR 4 — drop the `tr` prop

Components call `useTranslations('explore')` directly. Removes the `tr` prop from 11
components and restores next-intl's key typing. `DetailError` gets real message keys.

### PR 5 — split the shell

Extract `<DesktopRail>`, `<MobileSheet>` (with `useSheetDrag`), and `<ExploreSearch>`
(owning its own open/query/focus state, which kills 5 of `ExploreControls`' props).
Target: `explore-shell.tsx` under 250 lines, composing hooks and sections.

### PR 6 — dead code and the coverage gate

Delete `language-switcher.tsx` and the no-op `Providers`. Fix the `thresholds` shape so
the gate runs, then raise explore coverage to it. Expect this to be the largest PR by
line count and the smallest by risk.

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
