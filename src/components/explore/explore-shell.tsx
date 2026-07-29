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
import { MapView } from './map-view'
import { useTheme } from './theme-provider'
import { FilterOverlay } from './filter-overlay'
import { filterCount } from './filter-panel'
import { PassportFAB } from './passport/passport-fab'
import { ExploreTopBar } from './explore-top-bar'
import { RunList } from './explore-list'
import { ExploreControls } from './explore-controls'
import { DesktopRail, MobileSheet, mapInsets } from './explore-panels'
import { DetailOverlay } from './detail-panel'
import { detailKey } from './explore-route'
import { buildWeekDays } from './explore-week'
import { useDetailRoute, type DetailOverlayState } from './use-detail-route'
import { useExploreRouting } from './use-explore-routing'
import { useExploreCollections } from './use-explore-collections'
import {
  useContainerMetrics,
  useNowMinutes,
  useSheetDrag,
} from './use-explore-layout'
import { useExploreSearch } from './use-explore-search'
import { useAutoScrollToNextRun } from './use-auto-scroll'
import type { ExploreRun } from '@/lib/services/events'
import type { ExploreClub } from '@/lib/services/clubs'
import {
  useDetailPrefetch,
  useExploreClubs,
  useExploreRuns,
  useRunDetail,
  useWeekCounts,
  type WeekCount,
} from '@/lib/hooks/use-explore'

const PASSPORT_ENABLED = process.env.NEXT_PUBLIC_PASSPORT_ENABLED === 'true'

const ROOT_STYLE: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  overflow: 'hidden',
  zIndex: 1200,
}

export type InitialExploreData = {
  day: number
  weekCounts?: WeekCount[]
  runs?: ExploreRun[]
  clubs?: ExploreClub[]
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
  const [previewRunId, setPreviewRunId] = useState<string | null>(null)
  const clearPreview = useCallback(() => setPreviewRunId(null), [])
  const routing = useExploreRouting({ onNavigate: clearPreview })
  const { locale, mode, day, filters } = routing

  // ── Data ────────────────────────────────────────────────────────────────────
  const { data: weekCounts = [] } = useWeekCounts(initialData?.weekCounts)
  const { data: runs = [], isFetching: fetchingRuns } = useExploreRuns({
    day,
    initialData: initialData?.day === day ? initialData.runs : undefined,
  })
  const { data: clubs = [], isFetching: fetchingClubs } = useExploreClubs(
    initialData?.clubs
  )
  const { data: selectedRun } = useRunDetail(routing.selectedRunId)
  const { prefetchRun, prefetchClub } = useDetailPrefetch(locale)

  const loadingRuns = fetchingRuns && runs.length === 0
  const loadingClubs = fetchingClubs && clubs.length === 0

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
  const [allDoneDismissed, setAllDoneDismissed] = useState(false)

  const mapMeasured = containerH > 0 && (desktop || sheet.height > 0)

  // ── Detail panel ────────────────────────────────────────────────────────────
  const detail = useDetailRoute({
    currentDetail: routing.currentDetail,
    buildFallbackPath: useCallback(
      (overlay: DetailOverlayState | null) =>
        routing.detailFallbackPath(overlay?.kind),
      [routing]
    ),
  })

  const openRunDetail = useCallback(
    (id: string) => {
      prefetchRun(id)
      detail.openDetail({ kind: 'run', id })
      routing.pushRunDetail(id)
    },
    [detail, prefetchRun, routing]
  )

  const openClubDetail = useCallback(
    (id: string) => {
      const club = clubs.find((candidate) => candidate.id === id)
      if (!club) return
      prefetchClub(club.slug)
      detail.openDetail({ kind: 'club', slug: club.slug })
      routing.pushClubDetail(club.slug)
    },
    [clubs, detail, prefetchClub, routing]
  )

  // A club marker opens its panel; a run marker only previews in the list.
  const selectMapPoint = useCallback(
    (id: string) =>
      mode === 'clubs' ? openClubDetail(id) : setPreviewRunId(id),
    [mode, openClubDetail]
  )

  const preloadRun = useCallback(
    (id: string) => {
      prefetchRun(id)
      routing.prefetchRoute(`/run/${encodeURIComponent(id)}`)
    },
    [prefetchRun, routing]
  )

  const preloadClub = useCallback(
    (slug: string) => {
      prefetchClub(slug)
      routing.prefetchRoute(`/clubs/${encodeURIComponent(slug)}`)
    },
    [prefetchClub, routing]
  )

  // ── Derived ─────────────────────────────────────────────────────────────────
  const collections = useExploreCollections({
    runs,
    clubs,
    filters,
    searchQuery: search.query,
    mode,
    day,
    nowMin,
    selectedRun,
    selectedClubSlug: routing.selectedClubSlug,
  })

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

  const selectedId =
    mode === 'clubs'
      ? collections.selectedClubId
      : (routing.selectedRunId ?? previewRunId)
  const activeFilterCount = filterCount(filters)

  // ── Effects ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    setAllDoneDismissed(false)
  }, [day])

  const closeSearch = search.close
  useEffect(() => {
    if (!filtersOpen && !search.open) return
    const closeTopSurface = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (filtersOpen) {
        setFiltersOpen(false)
        return
      }
      closeSearch()
    }
    window.addEventListener('keydown', closeTopSurface)
    return () => window.removeEventListener('keydown', closeTopSurface)
  }, [closeSearch, filtersOpen, search.open])

  useAutoScrollToNextRun({
    listRef,
    enabled: mode === 'runs' && day === 0 && !loadingRuns,
    day,
    desktop,
    targetId: collections.nextRunId,
  })

  // ── Sections ────────────────────────────────────────────────────────────────
  const controls = (
    <ExploreControls
      mode={mode}
      setMode={routing.setMode}
      runCount={collections.runCount}
      clubCount={collections.clubCount}
      week={week}
      day={day}
      setDay={routing.setDay}
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
      runs={collections.filteredRuns}
      clubs={collections.filteredClubs}
      mode={mode}
      selId={selectedId}
      onSelect={setPreviewRunId}
      onOpenRun={openRunDetail}
      onOpenClub={openClubDetail}
      loading={mode === 'clubs' ? loadingClubs : loadingRuns}
      refreshing={mode === 'runs' && fetchingRuns && runs.length > 0}
      day={day}
      week={week}
      setDay={routing.setDay}
      nowMin={nowMin}
      hasActiveFilters={activeFilterCount > 0}
      hasSearchQuery={collections.hasSearchQuery}
      onClearFilters={routing.clearFilters}
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
      style={ROOT_STYLE}
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

      {mapMeasured && (
        <MapView
          points={collections.points}
          activeId={selectedId}
          onSelect={selectMapPoint}
          theme={theme}
          insets={mapInsets({
            desktop,
            containerHeight: containerH,
            sheetHeight: sheet.height,
            detailOpen: Boolean(detail.overlay),
          })}
          hideInactive={Boolean(detail.overlay && selectedId)}
          onReady={() => setMapReady(true)}
        />
      )}

      <ExploreTopBar
        desktop={desktop}
        locale={locale}
        theme={theme}
        onThemeChange={setTheme}
        onLocaleChange={routing.switchLocale}
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
          setFilters={routing.setFilters}
          onClose={() => setFiltersOpen(false)}
          resultCount={
            mode === 'clubs' ? collections.clubCount : collections.runCount
          }
          showTod={mode === 'runs'}
          loading={mode === 'clubs' ? false : loadingRuns}
          locale={locale}
        />
      )}

      {detail.previousOverlay && (
        <DetailOverlay
          key={detailKey(detail.previousOverlay)}
          overlay={detail.previousOverlay}
          inactive
        />
      )}
      {detail.overlay && (
        <DetailOverlay
          key={detailKey(detail.overlay)}
          overlay={detail.overlay}
          onClose={() => detail.requestExit(detail.overlay?.closeMode)}
          onEntered={detail.completeEnter}
          onExited={detail.completeExit}
        />
      )}

      {PASSPORT_ENABLED && <PassportFAB />}
    </div>
  )
}
