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
import { AllDoneNote } from './quiet-states'
import { ExploreControls } from './explore-controls'
import { DesktopRail, MobileSheet, mapInsets } from './explore-panels'
import { DetailOverlay } from './detail-panel'
import { detailKey } from './explore-route'
import { hasPainted, markPainted } from './explore-session'
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
import { getTorontoDayBounds } from '@/lib/utils/run-time'
import {
  useDetailPrefetch,
  useExploreClubs,
  useExploreRuns,
  useRunDetail,
  useWeekCounts,
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

// useSearchParams needs a Suspense boundary above it.
export function ExploreShell({
  serverDetail,
}: {
  serverDetail?: React.ReactNode
}) {
  return (
    <Suspense>
      <ExploreShellInner serverDetail={serverDetail} />
    </Suspense>
  )
}

function ExploreShellInner({
  serverDetail,
}: {
  serverDetail?: React.ReactNode
}) {
  const { theme, setTheme } = useTheme()
  const t = useTranslations('explore')
  const [previewRunId, setPreviewRunId] = useState<string | null>(null)
  const clearPreview = useCallback(() => setPreviewRunId(null), [])
  const routing = useExploreRouting({ onNavigate: clearPreview })
  const { locale, mode, day, filters } = routing
  const [dayAnchor, setDayAnchor] = useState<string | null>(null)

  useEffect(() => {
    const updateDay = () =>
      setDayAnchor(getTorontoDayBounds(0).start.toISOString())
    updateDay()
    const interval = window.setInterval(updateDay, 60_000)
    return () => window.clearInterval(interval)
  }, [])

  // ── Data ────────────────────────────────────────────────────────────────────
  const { data: weekCounts = [] } = useWeekCounts(dayAnchor)
  const { data: runs = [], isFetching: fetchingRuns } = useExploreRuns({
    day,
    anchor: dayAnchor,
  })
  const { data: clubs = [], isFetching: fetchingClubs } = useExploreClubs()
  const { data: selectedRun } = useRunDetail(routing.selectedRunId)
  const { prefetchRun, prefetchClub } = useDetailPrefetch(locale)

  const loadingRuns = !dayAnchor || (fetchingRuns && runs.length === 0)
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

  const [mapReady, setMapReady] = useState(hasPainted)
  // True only for a mount that follows an earlier paint, i.e. a locale switch.
  const restoredMount = useRef(hasPainted()).current
  const [suppressEntrance, setSuppressEntrance] = useState(restoredMount)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [allDoneDismissed, setAllDoneDismissed] = useState(false)
  // serverDetail only backs the very first paint, so crawlers get real HTML
  // without freezing the panel's back/open buttons into plain links forever.
  const [firstPaint, setFirstPaint] = useState(true)

  const mapMeasured = containerH > 0 && (desktop || sheet.height > 0)

  // ── Detail panel ────────────────────────────────────────────────────────────
  const detail = useDetailRoute({
    currentDetail: routing.currentDetail,
    buildFallbackPath: useCallback(
      (overlay: DetailOverlayState | null) =>
        routing.detailFallbackPath(overlay ?? undefined),
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
    },
    [prefetchRun]
  )

  const preloadClub = useCallback(
    (slug: string) => {
      prefetchClub(slug)
    },
    [prefetchClub]
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
      dayAnchor
        ? buildWeekDays({
            counts: weekCounts,
            locale,
            todayLabel: t('tonight'),
            tomorrowLabel: t('tomorrow'),
            now: new Date(dayAnchor),
          })
        : [],
    [dayAnchor, weekCounts, locale, t]
  )

  const selectedId =
    mode === 'clubs'
      ? collections.selectedClubId
      : (routing.selectedRunId ?? previewRunId)
  const activeFilterCount = filterCount(filters)

  // ── Effects ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!suppressEntrance) return
    const frame = requestAnimationFrame(() => setSuppressEntrance(false))
    return () => cancelAnimationFrame(frame)
  }, [suppressEntrance])

  useEffect(() => {
    setFirstPaint(false)
  }, [])

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
    instant: restoredMount,
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
    <>
      {!routing.currentDetail && (
        <header style={{ marginBottom: 16 }}>
          <h1
            style={{
              margin: '0 0 6px',
              fontSize: 22,
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          >
            {t(mode === 'clubs' ? 'clubs_heading' : 'runs_heading')}
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 13.5,
              lineHeight: 1.5,
              color: 'var(--dim)',
            }}
          >
            {t('directory_description')}
          </p>
        </header>
      )}
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
      />
    </>
  )

  // No upcoming run left today, and the list is not empty.
  const allDone =
    mode === 'runs' &&
    day === 0 &&
    collections.runCount > 0 &&
    !collections.nextRunId &&
    !allDoneDismissed

  const listOverlay = allDone ? (
    <AllDoneNote
      week={week}
      setDay={routing.setDay}
      onDismiss={() => setAllDoneDismissed(true)}
    />
  ) : undefined

  return (
    <div
      ref={rootRef}
      className={`qr-root qr-app${suppressEntrance ? ' is-restored' : ''}`}
      data-theme={theme}
      suppressHydrationWarning
      style={
        {
          ...ROOT_STYLE,
          // Lifts the map attribution clear of the sheet as it drags.
          '--qr-map-bottom': `${desktop ? 0 : sheet.height}px`,
        } as React.CSSProperties
      }
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
          onReady={() => {
            markPainted()
            setMapReady(true)
          }}
        />
      )}

      <ExploreTopBar
        desktop={desktop}
        locale={locale}
        theme={theme}
        onThemeChange={setTheme}
        localeHref={routing.localeHref}
      />

      {desktop ? (
        <DesktopRail
          listRef={listRef}
          controls={controls}
          overlay={listOverlay}
        >
          {list}
        </DesktopRail>
      ) : (
        <MobileSheet
          listRef={listRef}
          controls={controls}
          overlay={listOverlay}
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
          serverDetail={
            firstPaint &&
            detailKey(detail.overlay) === detailKey(routing.currentDetail)
              ? serverDetail
              : undefined
          }
          onClose={() => detail.requestExit(detail.overlay?.closeMode)}
          onEntered={detail.completeEnter}
          onExited={detail.completeExit}
        />
      )}

      {PASSPORT_ENABLED && <PassportFAB />}
    </div>
  )
}
