'use client'
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useTranslations } from 'next-intl'
import { MapView, type MapPoint } from './map-view'
import type { WeekDay } from './week-bar'
import { useTheme } from './theme-provider'
import { FilterOverlay } from './filter-overlay'
import {
  filterCount,
  runMatches,
  clubMatches,
  DEFAULT_FILTERS,
  type Filters,
} from './filter-panel'
import { PassportFAB } from './passport/passport-fab'
import { ExploreTopBar } from './explore-top-bar'
import { RunList } from './explore-list'
import { ExploreControls } from './explore-controls'
import {
  DesktopRail,
  DetailPanelSlot,
  MobileSheet,
  RAIL_WIDTH,
} from './explore-panels'
import {
  buildQs,
  dayOffsetFromRunId,
  detailKey,
  type Mode,
} from './explore-route'
import { useDetailRoute, type DetailOverlayState } from './use-detail-route'
import { useExploreUrlState } from './use-explore-url-state'
import {
  useAutoScrollToNextRun,
  useContainerMetrics,
  useExploreSearch,
  useNowMinutes,
  useSheetDrag,
} from './use-explore-layout'
import type { ExploreRun } from '@/lib/services/events'
import type { ExploreClub } from '@/lib/services/clubs'
import { isRunTimePast } from '@/lib/utils/run-time'
import { foldAccents, foldedIncludes } from '@/lib/utils/intl'
import {
  useDetailPrefetch,
  useExploreClubs,
  useExploreRuns,
  useRunDetail,
  useWeekCounts,
  type WeekCount,
} from '@/lib/hooks/use-explore'

const PASSPORT_ENABLED = process.env.NEXT_PUBLIC_PASSPORT_ENABLED === 'true'

export type InitialExploreData = {
  day: number
  weekCounts?: WeekCount[]
  runs?: ExploreRun[]
  clubs?: ExploreClub[]
}

function buildWeekDays({
  counts,
  locale,
  todayLabel,
  tomorrowLabel,
}: {
  counts: WeekCount[]
  locale: string
  todayLabel: string
  tomorrowLabel: string
}): WeekDay[] {
  const loc = locale === 'fr' ? 'fr-CA' : 'en-CA'
  const wdFmt = new Intl.DateTimeFormat(loc, { weekday: 'short' })
  const mdFmt = new Intl.DateTimeFormat(loc, { day: 'numeric', month: 'short' })
  const countMap = Object.fromEntries(
    counts.map(({ day, count }) => [day, count])
  )

  return Array.from({ length: 7 }, (_, o) => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() + o)

    const short =
      o === 0
        ? todayLabel
        : o === 1
          ? tomorrowLabel
          : wdFmt.format(date).replace('.', '').toUpperCase()

    return {
      offset: o,
      short,
      dateLabel: mdFmt.format(date).replace('.', ''),
      count: countMap[o] ?? 0,
    }
  })
}

function matchesQuery(
  haystack: (string | null | undefined)[],
  foldedQuery: string
) {
  return haystack.some((value) => foldedIncludes(value, foldedQuery))
}

// useSearchParams needs a Suspense boundary above it.
export function ExploreShell({
  initialData,
}: {
  initialData?: InitialExploreData
}) {
  return (
    <Suspense>
      <ExploreShellInner initialData={initialData} />
    </Suspense>
  )
}

function ExploreShellInner({
  initialData,
}: {
  initialData?: InitialExploreData
}) {
  const { theme, setTheme } = useTheme()
  const t = useTranslations('explore')
  const {
    locale,
    pathname,
    searchParams,
    mode,
    day,
    filters,
    selectedRunId,
    selectedClubSlug,
    currentDetail,
    updateUrl,
    router,
    startTransition,
  } = useExploreUrlState()

  // ── Data ────────────────────────────────────────────────────────────────────
  const { data: weekCounts = [] } = useWeekCounts(initialData?.weekCounts)
  const { data: runs = [], isFetching: fetchingRuns } = useExploreRuns({
    day,
    initialData: initialData?.day === day ? initialData.runs : undefined,
  })
  const { data: clubs = [], isFetching: fetchingClubs } = useExploreClubs(
    initialData?.clubs
  )
  const { data: selectedRun } = useRunDetail(selectedRunId)
  const { prefetchRun, prefetchClub } = useDetailPrefetch(locale)

  const loadingRuns = fetchingRuns && runs.length === 0
  const loadingClubs = fetchingClubs && clubs.length === 0

  // ── Detail panel ────────────────────────────────────────────────────────────
  const buildFallbackPath = useCallback(
    (detail: DetailOverlayState | null) =>
      detail?.kind === 'club'
        ? `/${locale}/clubs${buildQs(day, filters)}`
        : `/${locale}${buildQs(day, filters)}`,
    [day, filters, locale]
  )
  const {
    overlay: detailOverlay,
    previousOverlay: previousDetailOverlay,
    openDetail,
    requestExit,
    completeEnter,
    completeExit,
  } = useDetailRoute({ currentDetail, buildFallbackPath })

  // ── Layout ──────────────────────────────────────────────────────────────────
  const {
    rootRef,
    desktop,
    height: containerH,
  } = useContainerMetrics<HTMLDivElement>()
  const sheet = useSheetDrag(containerH)
  const search = useExploreSearch()
  const nowMin = useNowMinutes()
  const listRef = useRef<HTMLDivElement>(null)

  const [mapReady, setMapReady] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [previewRunId, setPreviewRunId] = useState<string | null>(null)
  const [allDoneDismissed, setAllDoneDismissed] = useState(false)

  const hasMeasuredMapLayout = containerH > 0 && (desktop || sheet.height > 0)
  const searchClose = search.close

  useEffect(() => {
    setAllDoneDismissed(false)
  }, [day])

  useEffect(() => {
    if (!filtersOpen && !search.open) return
    const closeTopSurface = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (filtersOpen) {
        setFiltersOpen(false)
        return
      }
      searchClose()
    }
    window.addEventListener('keydown', closeTopSurface)
    return () => window.removeEventListener('keydown', closeTopSurface)
  }, [filtersOpen, search.open, searchClose])

  // ── Navigation ──────────────────────────────────────────────────────────────
  const navigate = useCallback(
    (updates: Parameters<typeof updateUrl>[0]) => {
      setPreviewRunId(null)
      updateUrl({ ...updates, runId: null, clubSlug: null })
    },
    [updateUrl]
  )

  const setDay = useCallback((o: number) => navigate({ day: o }), [navigate])
  const setMode = useCallback((m: Mode) => navigate({ mode: m }), [navigate])
  const setFilters = useCallback(
    (fn: (prev: Filters) => Filters) => navigate({ filters: fn(filters) }),
    [filters, navigate]
  )
  const clearFilters = useCallback(
    () => updateUrl({ filters: DEFAULT_FILTERS }),
    [updateUrl]
  )

  const openRunDetail = useCallback(
    (id: string) => {
      const runDay = dayOffsetFromRunId(id) ?? day
      prefetchRun(id)
      openDetail({ kind: 'run', id })
      startTransition(() => {
        router.push(
          `/${locale}/run/${encodeURIComponent(id)}${buildQs(runDay, filters)}`,
          { scroll: false }
        )
      })
    },
    [day, filters, locale, openDetail, prefetchRun, router, startTransition]
  )

  const openClubDetail = useCallback(
    (id: string) => {
      const club = clubs.find((candidate) => candidate.id === id)
      if (!club) return
      prefetchClub(club.slug)
      openDetail({ kind: 'club', slug: club.slug })
      startTransition(() => {
        router.push(
          `/${locale}/clubs/${encodeURIComponent(club.slug)}${buildQs(day, filters)}`,
          { scroll: false }
        )
      })
    },
    [
      clubs,
      day,
      filters,
      locale,
      openDetail,
      prefetchClub,
      router,
      startTransition,
    ]
  )

  const preloadRun = useCallback(
    (id: string) => {
      prefetchRun(id)
      router.prefetch(`/${locale}/run/${encodeURIComponent(id)}`)
    },
    [locale, prefetchRun, router]
  )

  const preloadClub = useCallback(
    (slug: string) => {
      prefetchClub(slug)
      router.prefetch(`/${locale}/clubs/${encodeURIComponent(slug)}`)
    },
    [locale, prefetchClub, router]
  )

  const selectMapPoint = useCallback(
    (id: string) => {
      if (mode === 'clubs') {
        openClubDetail(id)
        return
      }
      setPreviewRunId(id)
    },
    [mode, openClubDetail]
  )

  // ── Derived ─────────────────────────────────────────────────────────────────
  const week = useMemo(
    () =>
      buildWeekDays({
        counts: weekCounts,
        locale,
        todayLabel: t('tonight'),
        tomorrowLabel: t('tomorrow'),
      }),
    [weekCounts, locale, t]
  )

  const query = foldAccents(search.query.trim())

  const filteredRuns = useMemo(() => {
    const byFilter = runs.filter((run) => runMatches(run, filters))
    if (!query) return byFilter
    return byFilter.filter((run) =>
      matchesQuery([run.title, run.club.name, run.address], query)
    )
  }, [runs, filters, query])

  const filteredClubs = useMemo(() => {
    const byFilter = clubs.filter((club) => clubMatches(club, filters))
    if (!query) return byFilter
    return byFilter.filter((club) =>
      matchesQuery([club.name, club.description], query)
    )
  }, [clubs, filters, query])

  const selectedRunPoint = useMemo<(MapPoint & { kind: 'run' }) | null>(() => {
    if (!selectedRun || selectedRun.lat === null || selectedRun.lng === null) {
      return null
    }
    return {
      id: selectedRun.id,
      lat: selectedRun.lat,
      lng: selectedRun.lng,
      kind: 'run',
      label: selectedRun.time,
      cancelled: selectedRun.status === 'CANCELLED',
      past: Boolean(selectedRun.isPast),
    }
  }, [selectedRun])

  const points = useMemo((): MapPoint[] => {
    if (mode === 'clubs') {
      return filteredClubs
        .filter((club) => club.lat !== null && club.lng !== null)
        .map((club) => ({
          id: club.id,
          lat: club.lat!,
          lng: club.lng!,
          kind: 'club' as const,
          label: club.name,
        }))
    }
    const runPoints: MapPoint[] = filteredRuns
      .filter((run) => run.lat !== null && run.lng !== null)
      .map((run) => ({
        id: run.id,
        lat: run.lat!,
        lng: run.lng!,
        kind: 'run' as const,
        label: run.time,
        cancelled: run.status === 'CANCELLED',
        past:
          day === 0 &&
          run.status !== 'CANCELLED' &&
          isRunTimePast(run.time, nowMin),
      }))
    if (
      selectedRunPoint &&
      !runPoints.some((point) => point.id === selectedRunPoint.id)
    ) {
      runPoints.push(selectedRunPoint)
    }
    return runPoints
  }, [day, filteredClubs, filteredRuns, mode, nowMin, selectedRunPoint])

  const selectedClubId = useMemo(() => {
    if (!selectedClubSlug) return null
    return clubs.find((club) => club.slug === selectedClubSlug)?.id ?? null
  }, [clubs, selectedClubSlug])

  const selId =
    mode === 'clubs' ? selectedClubId : (selectedRunId ?? previewRunId)
  const runCount = filteredRuns.length
  const clubCount = filteredClubs.length
  const activeFilterCount = filterCount(filters)

  const nextRunId = useMemo(
    () =>
      filteredRuns.find(
        (run) => run.status !== 'CANCELLED' && !isRunTimePast(run.time, nowMin)
      )?.id ?? null,
    [filteredRuns, nowMin]
  )

  useAutoScrollToNextRun({
    listRef,
    enabled: mode === 'runs' && day === 0 && !loadingRuns,
    day,
    desktop,
    targetId: nextRunId,
  })

  const insets = useMemo(
    () =>
      desktop
        ? { left: RAIL_WIDTH + 24, top: 24, bottom: 24 }
        : detailOverlay
          ? {
              left: 0,
              top: 76,
              bottom: Math.max(
                0,
                containerH - Math.min(300, Math.max(220, containerH * 0.3))
              ),
            }
          : { left: 0, top: 76, bottom: sheet.height },
    [containerH, desktop, detailOverlay, sheet.height]
  )

  const controls = (
    <ExploreControls
      mode={mode}
      setMode={setMode}
      runCount={runCount}
      clubCount={clubCount}
      week={week}
      day={day}
      setDay={setDay}
      searchOpen={search.open}
      setSearchOpen={search.setOpen}
      searchQuery={search.query}
      setSearchQuery={search.setQuery}
      searchInputRef={search.inputRef}
      activeFilterCount={activeFilterCount}
      onOpenFilters={() => setFiltersOpen(true)}
    />
  )

  const list = (
    <RunList
      runs={filteredRuns}
      clubs={filteredClubs}
      mode={mode}
      selId={selId}
      onSelect={setPreviewRunId}
      onOpenRun={openRunDetail}
      onOpenClub={openClubDetail}
      loading={mode === 'clubs' ? loadingClubs : loadingRuns}
      refreshing={mode === 'runs' && fetchingRuns && runs.length > 0}
      day={day}
      week={week}
      setDay={setDay}
      nowMin={nowMin}
      hasActiveFilters={activeFilterCount > 0}
      hasSearchQuery={query.length > 0}
      onClearFilters={clearFilters}
      allRuns={runs}
      onPreloadRun={preloadRun}
      onPreloadClub={preloadClub}
      allDoneDismissed={allDoneDismissed}
      onDismissAllDone={() => setAllDoneDismissed(true)}
    />
  )

  return (
    <div
      ref={rootRef}
      className="qr-root"
      data-theme={theme}
      suppressHydrationWarning
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        overflow: 'hidden',
        zIndex: 1200,
      }}
    >
      <picture className={`qr-map-preview${mapReady ? ' is-loaded' : ''}`}>
        <source media="(max-width: 767px)" srcSet="/map-preview-mobile.webp" />
        <img
          src="/map-preview-desktop.webp"
          alt=""
          width={1440}
          height={900}
          fetchPriority="high"
        />
      </picture>

      {hasMeasuredMapLayout && (
        <MapView
          points={points}
          activeId={selId}
          onSelect={selectMapPoint}
          theme={theme}
          insets={insets}
          hideInactive={Boolean(detailOverlay && selId)}
          onReady={() => setMapReady(true)}
        />
      )}

      <ExploreTopBar
        desktop={desktop}
        locale={locale}
        theme={theme}
        onThemeChange={setTheme}
        onLocaleChange={(nextLocale) => {
          const segments = pathname.split('/')
          segments[1] = nextLocale
          const qs = searchParams.toString()
          router.push(`${segments.join('/')}${qs ? `?${qs}` : ''}`)
        }}
      />

      {desktop ? (
        <DesktopRail listRef={listRef} controls={controls}>
          {list}
        </DesktopRail>
      ) : (
        <MobileSheet
          listRef={listRef}
          controls={controls}
          height={sheet.height}
          dragging={sheet.dragging}
          gripHandlers={sheet.gripHandlers}
        >
          {list}
        </MobileSheet>
      )}

      {filtersOpen && (
        <FilterOverlay
          desktop={desktop}
          filters={filters}
          setFilters={setFilters}
          onClose={() => setFiltersOpen(false)}
          resultCount={mode === 'clubs' ? clubCount : runCount}
          showTod={mode === 'runs'}
          loading={mode === 'clubs' ? false : loadingRuns}
          locale={locale}
        />
      )}

      {previousDetailOverlay && (
        <DetailPanelSlot
          key={detailKey(previousDetailOverlay)}
          overlay={previousDetailOverlay}
          inactive
        />
      )}
      {detailOverlay && (
        <DetailPanelSlot
          key={detailKey(detailOverlay)}
          overlay={detailOverlay}
          onClose={() => requestExit(detailOverlay.closeMode)}
          onEntered={completeEnter}
          onExited={completeExit}
        />
      )}

      {PASSPORT_ENABLED && <PassportFAB />}
    </div>
  )
}
