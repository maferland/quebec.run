'use client'
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import { MapView, type MapPoint } from './map-view'
import type { WeekDay } from './week-bar'
import { useTheme } from './theme-provider'
import {
  ClubDetailOverlay,
  PANEL_ENTER_MS,
  PANEL_EXIT_MS,
  loadRunDetail,
  preloadClubDetail,
  preloadRunDetail,
  RunDetailOverlay,
} from './detail-panel'
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
  buildQs,
  dayOffsetFromRunId,
  detailKey,
  parseDay,
  parseFilters,
  parseModeFromPath,
  parseRouteSelection,
  type DetailRoute,
  type Mode,
} from './explore-route'
import type { ExploreRun } from '@/lib/services/events'
import type { ExploreClub } from '@/lib/services/clubs'
import { getTorontoMinutes, isRunTimePast } from '@/lib/utils/run-time'

const PASSPORT_ENABLED = process.env.NEXT_PUBLIC_PASSPORT_ENABLED === 'true'
const RAIL_WIDTH = 404

type DetailOverlayState = DetailRoute & {
  exiting: boolean
  enter: boolean
  closeMode: 'history' | 'route'
}

export type InitialExploreData = {
  day: number
  weekCounts?: { day: number; count: number }[]
  runs?: ExploreRun[]
  clubs?: ExploreClub[]
}

// ── Week bar helpers ──────────────────────────────────────────────────────────

function buildWeekDays(
  counts: { day: number; count: number }[],
  locale: string,
  tr: (k: string) => string
): WeekDay[] {
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
        ? tr('tonight')
        : o === 1
          ? tr('tomorrow')
          : wdFmt.format(date).replace('.', '').toUpperCase()

    return {
      offset: o,
      short,
      dateLabel: mdFmt.format(date).replace('.', ''),
      count: countMap[o] ?? 0,
    }
  })
}

// ── Public export wraps inner in Suspense (required for useSearchParams) ─────

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

// ── Inner shell ───────────────────────────────────────────────────────────────

function ExploreShellInner({
  initialData,
}: {
  initialData?: InitialExploreData
}) {
  const { theme, setTheme } = useTheme()
  const locale = useLocale()
  const t = useTranslations('explore')
  const tr = useCallback((k: string) => t(k as Parameters<typeof t>[0]), [t])

  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const [, startTransition] = useTransition()
  const routeSelection = parseRouteSelection(pathname)
  const currentDetail = useMemo<DetailRoute | null>(() => {
    if (routeSelection.runId) return { kind: 'run', id: routeSelection.runId }
    if (routeSelection.clubSlug)
      return { kind: 'club', slug: routeSelection.clubSlug }
    return null
  }, [routeSelection.clubSlug, routeSelection.runId])
  const currentDetailKey = detailKey(currentDetail)
  const hydratedRef = useRef(false)
  const pendingCloseRef = useRef<'history' | 'route' | null>(null)
  const pendingOpenRef = useRef<string | null>(null)
  const closingDetailKeyRef = useRef<string | null>(null)
  const detailHistoryRef = useRef<DetailOverlayState[]>([])
  const pendingDetailBackRef = useRef<string | null>(null)
  const pendingDetailBackCloseModeRef = useRef<'history' | 'route' | null>(null)
  const exitFallbackRef = useRef<number | null>(null)
  const enterFallbackRef = useRef<number | null>(null)
  const [detailOverlay, setDetailOverlay] = useState<DetailOverlayState | null>(
    () =>
      currentDetail
        ? { ...currentDetail, exiting: false, enter: false, closeMode: 'route' }
        : null
  )
  const [previousDetailOverlay, setPreviousDetailOverlay] =
    useState<DetailOverlayState | null>(null)
  const [previewRunId, setPreviewRunId] = useState<string | null>(null)

  // ── URL-derived state ───────────────────────────────────────────────────────
  const mode = parseModeFromPath(pathname)
  const selectedRunId = routeSelection.runId ?? searchParams.get('run')
  const selectedClubSlug = routeSelection.clubSlug ?? searchParams.get('club')
  const day = searchParams.has('day')
    ? parseDay(searchParams)
    : (dayOffsetFromRunId(selectedRunId) ?? 0)
  const initialRuns = initialData?.day === day ? initialData.runs : undefined
  const hasInitialRuns = initialRuns !== undefined
  const runsByDayRef = useRef(
    new Map<number, ExploreRun[]>(
      initialData?.runs ? [[initialData.day, initialData.runs]] : []
    )
  )
  const filters = useMemo(() => parseFilters(searchParams), [searchParams])

  const clearExitFallback = useCallback(() => {
    if (!exitFallbackRef.current) return
    window.clearTimeout(exitFallbackRef.current)
    exitFallbackRef.current = null
  }, [])

  const clearEnterFallback = useCallback(() => {
    if (!enterFallbackRef.current) return
    window.clearTimeout(enterFallbackRef.current)
    enterFallbackRef.current = null
  }, [])

  const completeDetailEnter = useCallback(() => {
    clearEnterFallback()
    setPreviousDetailOverlay(null)
  }, [clearEnterFallback])

  const completeDetailExit = useCallback(() => {
    clearExitFallback()
    const pendingClose = pendingCloseRef.current
    pendingCloseRef.current = null
    if (pendingClose === 'history') {
      closingDetailKeyRef.current = detailKey(detailOverlay)
      setDetailOverlay(null)
      router.back()
      return
    }
    if (pendingClose === 'route') {
      const fallback =
        detailOverlay?.kind === 'club'
          ? `/${locale}/clubs${buildQs(day, filters)}`
          : `/${locale}${buildQs(day, filters)}`
      closingDetailKeyRef.current = detailKey(detailOverlay)
      setDetailOverlay(null)
      router.replace(fallback, { scroll: false })
      return
    }
    setDetailOverlay(null)
  }, [clearExitFallback, day, detailOverlay, filters, locale, router])

  const startDetailExit = useCallback(
    (closeMode?: 'history' | 'route') => {
      if (closeMode === 'history' && detailHistoryRef.current.length > 0) {
        const previousDetail = detailHistoryRef.current.pop() ?? null
        pendingDetailBackRef.current = detailKey(previousDetail)
        pendingDetailBackCloseModeRef.current =
          previousDetail?.closeMode ?? 'history'
        pendingCloseRef.current = null
        clearExitFallback()
        router.back()
        return
      }
      if (closeMode) pendingCloseRef.current = closeMode
      setDetailOverlay((overlay) =>
        overlay ? { ...overlay, exiting: true } : overlay
      )
      clearExitFallback()
      exitFallbackRef.current = window.setTimeout(
        completeDetailExit,
        PANEL_EXIT_MS + 100
      )
    },
    [clearExitFallback, completeDetailExit, router]
  )

  useEffect(() => {
    if (currentDetail) {
      if (closingDetailKeyRef.current === currentDetailKey) return
      closingDetailKeyRef.current = null
      const existingKey = detailKey(detailOverlay)
      const isPendingOpen = pendingOpenRef.current === currentDetailKey
      if (isPendingOpen) pendingOpenRef.current = null
      if (currentDetailKey === existingKey && isPendingOpen) {
        setDetailOverlay((overlay) =>
          overlay ? { ...overlay, closeMode: 'history' } : overlay
        )
        hydratedRef.current = true
        return
      }
      const closeMode = hydratedRef.current ? 'history' : 'route'
      if (currentDetailKey !== existingKey) {
        clearExitFallback()
        clearEnterFallback()
        pendingCloseRef.current = null
        const isDetailBack = pendingDetailBackRef.current === currentDetailKey
        pendingDetailBackRef.current = null
        const detailBackCloseMode = pendingDetailBackCloseModeRef.current
        pendingDetailBackCloseModeRef.current = null
        if (detailOverlay) {
          if (!isDetailBack) {
            detailHistoryRef.current.push(detailOverlay)
          }
          setPreviousDetailOverlay({
            ...detailOverlay,
            enter: false,
            exiting: false,
          })
          enterFallbackRef.current = window.setTimeout(
            completeDetailEnter,
            PANEL_ENTER_MS + 100
          )
        } else {
          setPreviousDetailOverlay(null)
        }
        setDetailOverlay({
          ...currentDetail,
          exiting: false,
          enter: hydratedRef.current,
          closeMode: isDetailBack
            ? (detailBackCloseMode ?? 'route')
            : closeMode,
        })
      }
      hydratedRef.current = true
      return
    }

    hydratedRef.current = true
    closingDetailKeyRef.current = null
    detailHistoryRef.current = []
    pendingDetailBackRef.current = null
    pendingDetailBackCloseModeRef.current = null
    clearEnterFallback()
    setPreviousDetailOverlay(null)
    if (
      pendingOpenRef.current &&
      pendingOpenRef.current === detailKey(detailOverlay)
    ) {
      return
    }
    if (!detailOverlay || detailOverlay.exiting) return
    startDetailExit()
  }, [
    clearExitFallback,
    clearEnterFallback,
    completeDetailEnter,
    currentDetail,
    currentDetailKey,
    detailOverlay,
    startDetailExit,
  ])

  useEffect(() => {
    return () => {
      clearEnterFallback()
      clearExitFallback()
    }
  }, [clearEnterFallback, clearExitFallback])

  useEffect(() => {
    const queryMode = searchParams.get('mode')
    const queryClubSlug = searchParams.get('club')
    const queryRunId = searchParams.get('run')

    if (!routeSelection.clubSlug && (queryMode === 'clubs' || queryClubSlug)) {
      const path = queryClubSlug
        ? `/${locale}/clubs/${encodeURIComponent(queryClubSlug)}`
        : `/${locale}/clubs`
      router.replace(`${path}${buildQs(day, filters)}`, { scroll: false })
      return
    }

    if (!routeSelection.runId && queryRunId) {
      router.replace(`/${locale}/run/${encodeURIComponent(queryRunId)}`, {
        scroll: false,
      })
    }
  }, [
    day,
    filters,
    locale,
    routeSelection.clubSlug,
    routeSelection.runId,
    router,
    searchParams,
  ])

  const updateUrl = useCallback(
    (updates: {
      day?: number
      mode?: Mode
      filters?: Filters
      runId?: string | null
      clubSlug?: string | null
    }) => {
      const newDay = updates.day ?? day
      const newMode = updates.mode ?? mode
      const newFilters = updates.filters ?? filters
      const newRunId =
        updates.runId === undefined ? selectedRunId : updates.runId
      const newClubSlug =
        updates.clubSlug === undefined ? selectedClubSlug : updates.clubSlug
      const basePath = newMode === 'clubs' ? `/${locale}/clubs` : `/${locale}`
      const selected =
        newMode === 'clubs'
          ? { clubSlug: newClubSlug, runId: null }
          : { runId: newRunId, clubSlug: null }
      const url = `${basePath}${buildQs(newDay, newFilters, selected)}`
      if (newMode === mode && !currentDetail && !newRunId && !newClubSlug) {
        window.history.replaceState(null, '', url)
        return
      }
      startTransition(() => {
        router.replace(url, { scroll: false })
      })
    },
    [
      day,
      mode,
      filters,
      selectedRunId,
      selectedClubSlug,
      currentDetail,
      locale,
      router,
      startTransition,
    ]
  )

  const setDay = useCallback(
    (o: number) => {
      setPreviewRunId(null)
      updateUrl({ day: o, runId: null, clubSlug: null })
    },
    [updateUrl]
  )

  const setMode = useCallback(
    (m: Mode) => {
      setPreviewRunId(null)
      updateUrl({ mode: m, runId: null, clubSlug: null })
    },
    [updateUrl]
  )

  const setFilters = useCallback(
    (fn: (prev: Filters) => Filters) => {
      setPreviewRunId(null)
      updateUrl({ filters: fn(filters), runId: null, clubSlug: null })
    },
    [filters, updateUrl]
  )

  // ── Local UI state ──────────────────────────────────────────────────────────
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const [desktop, setDesktop] = useState(false)
  const [containerH, setContainerH] = useState(0)
  const [mapReady, setMapReady] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQ, setSearchQ] = useState('')

  const [weekCounts, setWeekCounts] = useState<
    { day: number; count: number }[]
  >(() => initialData?.weekCounts ?? [])
  const [runs, setRuns] = useState<ExploreRun[]>(() => initialRuns ?? [])
  const [clubs, setClubs] = useState<ExploreClub[]>(
    () => initialData?.clubs ?? []
  )
  const initialRunsDayRef = useRef(hasInitialRuns ? day : null)
  const [selectedRunPoint, setSelectedRunPoint] = useState<
    (MapPoint & { kind: 'run' }) | null
  >(null)
  const [loadingRuns, setLoadingRuns] = useState(!hasInitialRuns)
  const [loadingClubs, setLoadingClubs] = useState(
    initialData?.clubs === undefined
  )

  const [dragging, setDragging] = useState(false)
  const dragRef = useRef<{ y: number; h: number } | null>(null)
  const snaps = useMemo(
    () => ({
      peek: Math.round(containerH * 0.34),
      mid: Math.round(containerH * 0.6),
      full: Math.round(containerH * 0.93),
    }),
    [containerH]
  )
  const [sheetH, setSheetH] = useState(0)
  const hasMeasuredMapLayout = containerH > 0 && (desktop || sheetH > 0)
  useEffect(() => {
    if (snaps.mid > 0 && !dragging) setSheetH(snaps.mid)
  }, [snaps.mid, dragging])

  // ── Side effects ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!searchOpen) return
    const frame = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [searchOpen])

  useEffect(() => {
    if (!filtersOpen && !searchOpen) return
    const closeOpenSurface = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (filtersOpen) {
        setFiltersOpen(false)
        return
      }
      setSearchOpen(false)
      setSearchQ('')
    }
    window.addEventListener('keydown', closeOpenSurface)
    return () => window.removeEventListener('keydown', closeOpenSurface)
  }, [filtersOpen, searchOpen])

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setDesktop(el.clientWidth >= 880)
      setContainerH(el.clientHeight)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (weekCounts.length > 0) return
    fetch('/api/explore/week-counts')
      .then((r) => {
        if (!r.ok) return []
        return r.json()
      })
      .then((data) => {
        if (Array.isArray(data)) setWeekCounts(data)
      })
      .catch(() => {})
  }, [weekCounts.length])

  useEffect(() => {
    if (initialRunsDayRef.current === day) {
      initialRunsDayRef.current = null
      setLoadingRuns(false)
      return
    }
    const cachedRuns = runsByDayRef.current.get(day)
    if (cachedRuns) {
      setRuns(cachedRuns)
      setLoadingRuns(false)
      return
    }
    const controller = new AbortController()
    setLoadingRuns(true)
    fetch(`/api/explore/runs?day=${day}`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) return []
        return r.json()
      })
      .then((data: ExploreRun[]) => {
        if (!Array.isArray(data)) return
        runsByDayRef.current.set(day, data)
        setRuns(data)
      })
      .catch((error) => {
        if (error?.name !== 'AbortError') return
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingRuns(false)
      })
    return () => controller.abort()
  }, [day])

  useEffect(() => {
    let active = true
    if (!selectedRunId) {
      setSelectedRunPoint(null)
      return
    }

    loadRunDetail(selectedRunId)
      .then((run) => {
        if (!active) return
        setSelectedRunPoint(
          run.lat === null || run.lng === null
            ? null
            : {
                id: run.id,
                lat: run.lat,
                lng: run.lng,
                kind: 'run',
                label: run.time,
                cancelled: run.status === 'CANCELLED',
                past: run.isPast,
              }
        )
      })
      .catch(() => {
        if (active) setSelectedRunPoint(null)
      })

    return () => {
      active = false
    }
  }, [selectedRunId])

  useEffect(() => {
    if (clubs.length > 0) {
      setLoadingClubs(false)
      return
    }
    const controller = new AbortController()
    fetch('/api/explore/clubs', { signal: controller.signal })
      .then((r) => {
        if (!r.ok) return []
        return r.json()
      })
      .then((data) => {
        if (Array.isArray(data)) setClubs(data)
      })
      .catch((error) => {
        if (error?.name !== 'AbortError') return
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingClubs(false)
      })
    return () => controller.abort()
  }, [clubs.length])

  // ── Derived values ──────────────────────────────────────────────────────────

  const week = useMemo(
    () => buildWeekDays(weekCounts, locale, tr),
    [weekCounts, locale, tr]
  )

  const [nowMin, setNowMin] = useState(() => getTorontoMinutes())

  useEffect(() => {
    const updateNow = () => setNowMin(getTorontoMinutes())
    updateNow()
    const interval = window.setInterval(updateNow, 60_000)
    return () => window.clearInterval(interval)
  }, [])

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
          : { left: 0, top: 76, bottom: sheetH },
    [containerH, desktop, detailOverlay, sheetH]
  )

  const filteredRuns = useMemo(() => {
    const byFilter = runs.filter((r) => runMatches(r, filters))
    if (!searchQ.trim()) return byFilter
    const q = searchQ.toLowerCase()
    return byFilter.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.club.name.toLowerCase().includes(q) ||
        (r.address?.toLowerCase().includes(q) ?? false)
    )
  }, [runs, filters, searchQ])

  const filteredClubs = useMemo(() => {
    const byFilter = clubs.filter((c) => clubMatches(c, filters))
    if (!searchQ.trim()) return byFilter
    const q = searchQ.toLowerCase()
    return byFilter.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.description?.toLowerCase().includes(q) ?? false)
    )
  }, [clubs, filters, searchQ])

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

  const setSelectedId = useCallback((id: string | null) => {
    setPreviewRunId(id)
  }, [])

  const openRunDetail = useCallback(
    (id: string) => {
      const runDay = dayOffsetFromRunId(id) ?? day
      const detail: DetailRoute = { kind: 'run', id }
      closingDetailKeyRef.current = null
      pendingOpenRef.current = detailKey(detail)
      preloadRunDetail(id)
      setDetailOverlay({
        ...detail,
        exiting: false,
        enter: true,
        closeMode: 'route',
      })
      startTransition(() => {
        router.push(
          `/${locale}/run/${encodeURIComponent(id)}${buildQs(runDay, filters)}`,
          { scroll: false }
        )
      })
    },
    [day, filters, locale, router, startTransition]
  )

  const openClubDetail = useCallback(
    (id: string) => {
      const club = clubs.find((candidate) => candidate.id === id)
      if (!club) return
      const detail: DetailRoute = { kind: 'club', slug: club.slug }
      closingDetailKeyRef.current = null
      pendingOpenRef.current = detailKey(detail)
      preloadClubDetail(club.slug, locale)
      setDetailOverlay({
        ...detail,
        exiting: false,
        enter: true,
        closeMode: 'route',
      })
      startTransition(() => {
        router.push(
          `/${locale}/clubs/${encodeURIComponent(club.slug)}${buildQs(day, filters)}`,
          { scroll: false }
        )
      })
    },
    [clubs, day, filters, locale, router, startTransition]
  )

  const selectMapPoint = useCallback(
    (id: string) => {
      if (mode === 'clubs') {
        openClubDetail(id)
        return
      }
      setSelectedId(id)
    },
    [mode, openClubDetail, setSelectedId]
  )

  const runCount = filteredRuns.length
  const clubCount = filteredClubs.length
  const activeFilterCount = filterCount(filters)

  const preloadRun = useCallback(
    (id: string) => {
      preloadRunDetail(id)
      router.prefetch(`/${locale}/run/${encodeURIComponent(id)}`)
    },
    [locale, router]
  )

  const preloadClub = useCallback(
    (slug: string) => {
      preloadClubDetail(slug, locale)
      router.prefetch(`/${locale}/clubs/${encodeURIComponent(slug)}`)
    },
    [locale, router]
  )

  // ── Grip drag ───────────────────────────────────────────────────────────────

  const onGripDown = useCallback(
    (e: React.PointerEvent) => {
      dragRef.current = { y: e.clientY, h: sheetH }
      setDragging(true)
      try {
        ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      } catch {}
    },
    [sheetH]
  )
  const onGripMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current) return
      const dy = e.clientY - dragRef.current.y
      setSheetH(() => {
        const h = dragRef.current!.h - dy
        return Math.max(snaps.peek, Math.min(snaps.full, h))
      })
    },
    [snaps]
  )
  const onGripUp = useCallback(() => {
    if (!dragRef.current) return
    dragRef.current = null
    setDragging(false)
    setSheetH((h) => {
      const arr = [snaps.peek, snaps.mid, snaps.full]
      return arr.reduce((a, b) => (Math.abs(b - h) < Math.abs(a - h) ? b : a))
    })
  }, [snaps])

  const controls = (
    <ExploreControls
      mode={mode}
      setMode={setMode}
      runCount={runCount}
      clubCount={clubCount}
      week={week}
      day={day}
      setDay={setDay}
      searchOpen={searchOpen}
      setSearchOpen={setSearchOpen}
      searchQuery={searchQ}
      setSearchQuery={setSearchQ}
      searchInputRef={searchInputRef}
      activeFilterCount={activeFilterCount}
      onOpenFilters={() => setFiltersOpen(true)}
      tr={tr}
    />
  )

  const clearFilters = useCallback(
    () => updateUrl({ filters: DEFAULT_FILTERS }),
    [updateUrl]
  )

  const list = (
    <RunList
      runs={filteredRuns}
      clubs={filteredClubs}
      mode={mode}
      selId={selId}
      onSelect={setSelectedId}
      onOpenRun={openRunDetail}
      onOpenClub={openClubDetail}
      loading={
        mode === 'clubs'
          ? loadingClubs && clubs.length === 0
          : loadingRuns && runs.length === 0
      }
      refreshing={mode === 'runs' && loadingRuns && runs.length > 0}
      tr={tr}
      day={day}
      week={week}
      setDay={setDay}
      nowMin={nowMin}
      hasActiveFilters={activeFilterCount > 0}
      hasSearchQuery={searchQ.trim().length > 0}
      onClearFilters={clearFilters}
      allRuns={runs}
      onPreloadRun={preloadRun}
      onPreloadClub={preloadClub}
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
          const query = searchParams.toString()
          router.push(`${segments.join('/')}${query ? `?${query}` : ''}`)
        }}
        tr={tr}
      />
      {/* Desktop rail */}
      {desktop && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: RAIL_WIDTH,
            zIndex: 35,
            display: 'flex',
            flexDirection: 'column',
            background: 'color-mix(in oklch, var(--bg) 88%, transparent)',
            backdropFilter: 'blur(16px)',
            borderRight: '1px solid var(--line)',
            boxShadow: '8px 0 40px rgba(0,0,0,.4)',
          }}
        >
          <div style={{ height: 94, flexShrink: 0 }} />
          <div
            style={{
              padding: '4px 18px 14px',
              borderBottom: '1px solid var(--line)',
              flexShrink: 0,
            }}
          >
            {controls}
          </div>
          <div
            ref={listRef}
            className="qr-themed-scroll"
            style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 26px' }}
          >
            {list}
          </div>
        </div>
      )}

      {/* Mobile bottom sheet */}
      {!desktop && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: sheetH || '60dvh',
            zIndex: 35,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg)',
            borderTop: '1px solid var(--line-2)',
            borderRadius: 'var(--r-xl) var(--r-xl) 0 0',
            boxShadow: '0 -12px 40px rgba(0,0,0,.5)',
            transition: dragging
              ? 'none'
              : 'height .34s cubic-bezier(.2,.7,.3,1)',
            overflow: 'hidden',
          }}
        >
          <div
            onPointerDown={onGripDown}
            onPointerMove={onGripMove}
            onPointerUp={onGripUp}
            onPointerCancel={onGripUp}
            style={{
              flexShrink: 0,
              padding: '10px 16px 8px',
              cursor: 'grab',
              touchAction: 'none',
            }}
          >
            <div
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                background: 'var(--line-2)',
                margin: '0 auto',
              }}
            />
          </div>
          <div style={{ flexShrink: 0, padding: '0 16px 12px' }}>
            {controls}
          </div>
          <div
            ref={listRef}
            className="qr-themed-scroll"
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '4px 16px calc(22px + env(safe-area-inset-bottom))',
            }}
          >
            {list}
          </div>
        </div>
      )}

      {/* Filter overlay */}
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
          tr={tr}
        />
      )}

      {/* Route-owned detail panel */}
      {previousDetailOverlay?.kind === 'run' && (
        <RunDetailOverlay
          key={detailKey(previousDetailOverlay)}
          id={previousDetailOverlay.id}
          enter={false}
          inactive
        />
      )}
      {previousDetailOverlay?.kind === 'club' && (
        <ClubDetailOverlay
          key={detailKey(previousDetailOverlay)}
          slug={previousDetailOverlay.slug}
          enter={false}
          inactive
        />
      )}
      {detailOverlay?.kind === 'run' && (
        <RunDetailOverlay
          key={detailKey(detailOverlay)}
          id={detailOverlay.id}
          enter={detailOverlay.enter}
          exiting={detailOverlay.exiting}
          onClose={() => startDetailExit(detailOverlay.closeMode)}
          onEntered={completeDetailEnter}
          onExited={completeDetailExit}
        />
      )}
      {detailOverlay?.kind === 'club' && (
        <ClubDetailOverlay
          key={detailKey(detailOverlay)}
          slug={detailOverlay.slug}
          enter={detailOverlay.enter}
          exiting={detailOverlay.exiting}
          onClose={() => startDetailExit(detailOverlay.closeMode)}
          onEntered={completeDetailEnter}
          onExited={completeDetailExit}
        />
      )}

      {/* Passport FAB */}
      {PASSPORT_ENABLED && <PassportFAB tr={tr} />}
    </div>
  )
}
