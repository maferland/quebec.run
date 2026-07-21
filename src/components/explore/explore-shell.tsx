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
import Link from 'next/link'
import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import { MapView, type MapPoint } from './map-view'
import { WeekBar, type WeekDay } from './week-bar'
import { useTheme } from './theme-provider'
import { RunCard } from './run-card'
import { ClubCard } from './club-card'
import {
  ClubDetailOverlay,
  PANEL_ENTER_MS,
  PANEL_EXIT_MS,
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
import { EmptyDay, NoMatch, AllDoneNote } from './quiet-states'
import { PassportFAB } from './passport/passport-fab'
import type { ExploreRun } from '@/lib/services/events'
import type { ExploreClub } from '@/lib/services/clubs'

const PASSPORT_ENABLED = Boolean(process.env.NEXT_PUBLIC_PASSPORT_ENABLED)
const RAIL_WIDTH = 404

type Mode = 'runs' | 'clubs'
type DetailRoute = { kind: 'run'; id: string } | { kind: 'club'; slug: string }

type DetailOverlayState = DetailRoute & {
  exiting: boolean
  enter: boolean
  closeMode: 'history' | 'route'
}

// ── URL param helpers ─────────────────────────────────────────────────────────

function parseDay(p: URLSearchParams): number {
  const d = parseInt(p.get('day') ?? '0')
  return isNaN(d) || d < 0 || d > 6 ? 0 : d
}

function parseModeFromPath(pathname: string): Mode {
  const section = pathname.split('/')[2]
  return section === 'clubs' || section === 'club' ? 'clubs' : 'runs'
}

function parseRouteSelection(pathname: string) {
  const [, , section, id] = pathname.split('/')
  if (!id) return { runId: null, clubSlug: null }
  if (section === 'run')
    return { runId: decodeURIComponent(id), clubSlug: null }
  if (section === 'club' || section === 'clubs')
    return { runId: null, clubSlug: decodeURIComponent(id) }
  return { runId: null, clubSlug: null }
}

function detailKey(detail: DetailRoute | null): string | null {
  if (!detail) return null
  return detail.kind === 'run' ? `run:${detail.id}` : `club:${detail.slug}`
}

function parseFilters(p: URLSearchParams): Filters {
  return {
    types: p.get('types')?.split(',').filter(Boolean) ?? [],
    vibes: p.get('vibes')?.split(',').filter(Boolean) ?? [],
    pace: p.get('pace') ?? 'any',
    beginner: p.get('beginner') === '1',
    tod: p.get('tod') ?? 'all',
  }
}

function dayOffsetFromRunId(id: string | null): number | null {
  const date = id?.match(/(?:--|:)(\d{4}-\d{2}-\d{2})$/)?.[1]
  if (!date) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(`${date}T00:00:00`)
  const offset = Math.round((target.getTime() - today.getTime()) / 86400000)
  return offset >= 0 && offset <= 6 ? offset : null
}

function buildQs(
  day: number,
  filters: Filters,
  selected: { runId?: string | null; clubSlug?: string | null } = {}
): string {
  const p = new URLSearchParams()
  if (day !== 0) p.set('day', String(day))
  if (filters.types.length) p.set('types', filters.types.join(','))
  if (filters.vibes.length) p.set('vibes', filters.vibes.join(','))
  if (filters.pace !== 'any') p.set('pace', filters.pace)
  if (filters.beginner) p.set('beginner', '1')
  if (filters.tod !== 'all') p.set('tod', filters.tod)
  if (selected.runId) p.set('run', selected.runId)
  if (selected.clubSlug) p.set('club', selected.clubSlug)
  const s = p.toString()
  return s ? `?${s}` : ''
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

function todMin(): number {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

function toMin(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

// ── Public export wraps inner in Suspense (required for useSearchParams) ─────

export function ExploreShell() {
  return (
    <Suspense>
      <ExploreShellInner />
    </Suspense>
  )
}

// ── Inner shell ───────────────────────────────────────────────────────────────

function ExploreShellInner() {
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
  const detailHistoryRef = useRef<DetailRoute[]>([])
  const pendingDetailBackRef = useRef<string | null>(null)
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
  const [previewClubId, setPreviewClubId] = useState<string | null>(null)

  // ── URL-derived state ───────────────────────────────────────────────────────
  const mode = parseModeFromPath(pathname)
  const selectedRunId = routeSelection.runId ?? searchParams.get('run')
  const selectedClubSlug = routeSelection.clubSlug ?? searchParams.get('club')
  const day = searchParams.has('day')
    ? parseDay(searchParams)
    : (dayOffsetFromRunId(selectedRunId) ?? 0)
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
      pendingOpenRef.current = null
      const existingKey = detailKey(detailOverlay)
      const closeMode = hydratedRef.current ? 'history' : 'route'
      if (currentDetailKey !== existingKey) {
        clearExitFallback()
        clearEnterFallback()
        pendingCloseRef.current = null
        const isDetailBack = pendingDetailBackRef.current === currentDetailKey
        pendingDetailBackRef.current = null
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
          closeMode,
        })
      }
      hydratedRef.current = true
      return
    }

    hydratedRef.current = true
    closingDetailKeyRef.current = null
    detailHistoryRef.current = []
    pendingDetailBackRef.current = null
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
      startTransition(() => {
        router.replace(`${basePath}${buildQs(newDay, newFilters, selected)}`, {
          scroll: false,
        })
      })
    },
    [
      day,
      mode,
      filters,
      selectedRunId,
      selectedClubSlug,
      locale,
      router,
      startTransition,
    ]
  )

  const setDay = useCallback(
    (o: number) => {
      setPreviewRunId(null)
      setPreviewClubId(null)
      updateUrl({ day: o, runId: null, clubSlug: null })
    },
    [updateUrl]
  )

  const setMode = useCallback(
    (m: Mode) => {
      setPreviewRunId(null)
      setPreviewClubId(null)
      updateUrl({ mode: m, runId: null, clubSlug: null })
    },
    [updateUrl]
  )

  const setFilters = useCallback(
    (fn: (prev: Filters) => Filters) => {
      setPreviewRunId(null)
      setPreviewClubId(null)
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
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQ, setSearchQ] = useState('')

  const [weekCounts, setWeekCounts] = useState<
    { day: number; count: number }[]
  >([])
  const [runs, setRuns] = useState<ExploreRun[]>([])
  const [clubs, setClubs] = useState<ExploreClub[]>([])
  const [loadingRuns, setLoadingRuns] = useState(false)
  const [loadingClubs, setLoadingClubs] = useState(true)

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
    fetch('/api/explore/week-counts')
      .then((r) => {
        if (!r.ok) return []
        return r.json()
      })
      .then((data) => {
        if (Array.isArray(data)) setWeekCounts(data)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    setLoadingRuns(true)
    fetch(`/api/explore/runs?day=${day}`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) return []
        return r.json()
      })
      .then((data: ExploreRun[]) => {
        if (!Array.isArray(data)) return
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

  const nowMin = todMin()

  const points = useMemo((): MapPoint[] => {
    if (mode === 'clubs') {
      return clubs
        .filter((c) => c.lat !== null && c.lng !== null)
        .map((c) => ({
          id: c.id,
          lat: c.lat!,
          lng: c.lng!,
          kind: 'club' as const,
          label: c.name,
        }))
    }
    return runs
      .filter((r) => r.lat !== null && r.lng !== null)
      .map((r) => ({
        id: r.id,
        lat: r.lat!,
        lng: r.lng!,
        kind: 'run' as const,
        label: r.time,
        cancelled: r.status === 'CANCELLED',
        past: day === 0 && r.status !== 'CANCELLED' && toMin(r.time) < nowMin,
      }))
  }, [mode, clubs, runs, day, nowMin])
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

  const selectedClubId = useMemo(() => {
    if (!selectedClubSlug) return null
    return clubs.find((club) => club.slug === selectedClubSlug)?.id ?? null
  }, [clubs, selectedClubSlug])

  const selId =
    mode === 'clubs'
      ? (selectedClubId ?? previewClubId)
      : (selectedRunId ?? previewRunId)

  const setSelectedId = useCallback(
    (id: string | null) => {
      if (mode === 'clubs') {
        setPreviewRunId(null)
        setPreviewClubId(id)
        return
      }
      setPreviewClubId(null)
      setPreviewRunId(id)
    },
    [mode]
  )

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

  // ── Controls ────────────────────────────────────────────────────────────────

  const controls = (
    <>
      <div
        className={`qr-week-slot${mode === 'clubs' ? ' is-inactive' : ''}`}
        aria-hidden={mode === 'clubs'}
        inert={mode === 'clubs'}
      >
        <WeekBar week={week} selected={day} onSelect={setDay} />
      </div>
      <div className="qr-search-toolbar">
        <div
          className={`qr-search-layer${searchOpen ? ' is-open' : ''}`}
          aria-hidden={!searchOpen}
          inert={!searchOpen}
        >
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'var(--surface)',
              border: '1px solid var(--line-2)',
              borderRadius: 100,
              padding: '0 14px',
              height: 40,
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: 'var(--faint)', flexShrink: 0 }}
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              ref={searchInputRef}
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder={tr('search_placeholder')}
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                color: 'var(--text)',
                fontFamily: 'var(--font-ui)',
                fontSize: 14.5,
                outline: 'none',
              }}
            />
          </div>
          <button
            className="tap"
            aria-label={tr('search_close')}
            onClick={() => {
              setSearchOpen(false)
              setSearchQ('')
            }}
            style={{
              border: 'none',
              background: 'var(--surface)',
              color: 'var(--dim)',
              width: 40,
              height: 40,
              borderRadius: 100,
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div
          className={`qr-toolbar-layer${searchOpen ? ' is-hidden' : ''}`}
          aria-hidden={searchOpen}
          inert={searchOpen}
        >
          <ModeToggle
            mode={mode}
            setMode={setMode}
            runCount={runCount}
            clubCount={clubCount}
            tr={tr}
          />
          <button
            className="tap"
            aria-label={tr('search_open')}
            onClick={() => setSearchOpen(true)}
            style={{
              border: '1px solid var(--line-2)',
              background: 'var(--surface)',
              color: 'var(--dim)',
              width: 40,
              height: 40,
              borderRadius: 100,
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>
          <FilterButton
            n={activeFilterCount}
            onClick={() => setFiltersOpen(true)}
            tr={tr}
          />
        </div>
      </div>
    </>
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
      <MapView
        points={points}
        activeId={selId}
        onSelect={setSelectedId}
        theme={theme}
        insets={insets}
        hideInactive={Boolean(detailOverlay && selId)}
      />

      {/* Top bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: desktop ? '18px 22px' : '16px 16px',
          pointerEvents: 'none',
        }}
      >
        <Link
          href={`/${locale}`}
          style={{
            pointerEvents: 'auto',
            background: 'color-mix(in oklch, var(--bg) 72%, transparent)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--line)',
            borderRadius: 100,
            padding: desktop ? '8px 14px' : '7px 12px',
            boxShadow: '0 2px 8px rgba(0,0,0,.18)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: 'inherit',
            textDecoration: 'none',
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: 'var(--accent)',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--accent-ink)"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle
                cx="14"
                cy="5"
                r="1.8"
                fill="currentColor"
                stroke="none"
              />
              <path d="M6 21l3-5 3 1 1-4-4-2 1-3 4 2 2 3" />
            </svg>
          </div>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: '-0.02em',
            }}
          >
            quebec<span style={{ color: 'var(--accent)' }}>.run</span>
          </span>
        </Link>

        <div style={{ pointerEvents: 'auto', display: 'flex', gap: 8 }}>
          <div
            style={{
              display: 'flex',
              background: 'color-mix(in oklch, var(--bg) 72%, transparent)',
              backdropFilter: 'blur(12px)',
              border: '1px solid var(--line)',
              borderRadius: 100,
              padding: 3,
              gap: 2,
            }}
          >
            {(['dark', 'light'] as const).map((v) => (
              <button
                key={v}
                aria-label={v === 'dark' ? tr('theme_dark') : tr('theme_light')}
                onClick={() => setTheme(v)}
                style={{
                  border: 'none',
                  borderRadius: 100,
                  width: 30,
                  height: 26,
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                  background: theme === v ? 'var(--surface-3)' : 'transparent',
                  color: theme === v ? 'var(--accent)' : 'var(--faint)',
                }}
              >
                {v === 'dark' ? (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                ) : (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                )}
              </button>
            ))}
          </div>
          <div
            style={{
              display: 'flex',
              background: 'color-mix(in oklch, var(--bg) 72%, transparent)',
              backdropFilter: 'blur(12px)',
              border: '1px solid var(--line)',
              borderRadius: 100,
              padding: 3,
              gap: 2,
            }}
          >
            {(['fr', 'en'] as const).map((l) => (
              <button
                key={l}
                aria-label={l === 'fr' ? 'Français' : 'English'}
                onClick={() => {
                  const segments = pathname.split('/')
                  segments[1] = l
                  const qs = searchParams.toString()
                  router.push(`${segments.join('/')}${qs ? '?' + qs : ''}`)
                }}
                style={{
                  border: 'none',
                  borderRadius: 100,
                  padding: '0 8px',
                  height: 26,
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                  background: locale === l ? 'var(--surface-3)' : 'transparent',
                  color: locale === l ? 'var(--fg)' : 'var(--faint)',
                  fontFamily: 'var(--font-ui)',
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

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
            height: sheetH,
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

// ── Sub-components ────────────────────────────────────────────────────────────

const FilterIcon = (
  <svg
    width="19"
    height="19"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 5h18M6 12h12M10 19h4" />
  </svg>
)

function FilterButton({
  n,
  onClick,
  tr,
}: {
  n: number
  onClick: () => void
  tr: (k: string) => string
}) {
  const on = n > 0
  return (
    <button
      aria-label={tr('filters')}
      onClick={onClick}
      style={{
        width: 44,
        height: 44,
        flexShrink: 0,
        display: 'grid',
        placeItems: 'center',
        cursor: 'pointer',
        border: `1px solid ${on ? 'transparent' : 'var(--line)'}`,
        background: on ? 'var(--lime-dim)' : 'var(--surface)',
        color: on ? 'var(--accent-fg)' : 'var(--text)',
        borderRadius: 14,
        position: 'relative',
      }}
    >
      {FilterIcon}
      {on && (
        <span
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            width: 8,
            height: 8,
            borderRadius: 4,
            background: 'var(--accent)',
          }}
        />
      )}
    </button>
  )
}

function ModeToggle({
  mode,
  setMode,
  runCount,
  clubCount,
  tr,
}: {
  mode: Mode
  setMode: (m: Mode) => void
  runCount: number
  clubCount: number
  tr: (k: string) => string
}) {
  const opt = (id: Mode, label: string, count: number) => {
    const on = mode === id
    return (
      <button
        key={id}
        onClick={() => setMode(id)}
        style={{
          flex: 1,
          border: 'none',
          borderRadius: 12,
          padding: '9px 12px',
          fontFamily: 'var(--font-ui)',
          fontWeight: 700,
          fontSize: 14,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 7,
          background: on ? 'var(--surface-3)' : 'transparent',
          color: on ? 'var(--text)' : 'var(--faint)',
          boxShadow: on
            ? '0 1px 0 rgba(255,255,255,.04) inset, 0 1px 3px rgba(0,0,0,.3)'
            : 'none',
        }}
      >
        {label}
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: on ? 'var(--accent-fg)' : 'var(--faint)',
          }}
        >
          {count}
        </span>
      </button>
    )
  }

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        background: 'var(--bg-2)',
        border: '1px solid var(--line)',
        borderRadius: 14,
        padding: 4,
        gap: 3,
      }}
    >
      {opt('runs', tr('runs'), runCount)}
      {opt('clubs', tr('clubs'), clubCount)}
    </div>
  )
}

function RunList({
  runs,
  clubs,
  mode,
  selId,
  onSelect,
  onOpenRun,
  onOpenClub,
  loading,
  refreshing,
  tr,
  day,
  week,
  setDay,
  nowMin,
  hasActiveFilters,
  hasSearchQuery,
  onClearFilters,
  allRuns,
  onPreloadRun,
  onPreloadClub,
}: {
  runs: ExploreRun[]
  clubs: ExploreClub[]
  mode: Mode
  selId: string | null
  onSelect: (id: string | null) => void
  onOpenRun: (id: string) => void
  onOpenClub: (id: string) => void
  loading: boolean
  refreshing: boolean
  tr: (k: string) => string
  day: number
  week: WeekDay[]
  setDay: (o: number) => void
  nowMin: number
  hasActiveFilters: boolean
  hasSearchQuery: boolean
  onClearFilters: () => void
  allRuns: ExploreRun[]
  onPreloadRun: (id: string) => void
  onPreloadClub: (slug: string) => void
}) {
  const resultCount = mode === 'clubs' ? clubs.length : runs.length
  const resultLabel =
    mode === 'clubs'
      ? tr(resultCount === 1 ? 'clubs_count_one' : 'clubs_count_many')
      : tr(resultCount === 1 ? 'results_one' : 'results_many')
  const resultSummary = (
    <div style={{ fontSize: 13, color: 'var(--faint)', padding: '0 2px 2px' }}>
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          color: 'var(--text)',
          fontSize: 15,
        }}
      >
        {resultCount}
      </span>{' '}
      {resultLabel}
    </div>
  )

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="skel"
            style={{ height: 80, borderRadius: 'var(--r-lg)' }}
          />
        ))}
      </div>
    )
  }

  if (mode === 'clubs') {
    if (clubs.length === 0) {
      return hasActiveFilters ? (
        <NoMatch onClearFilters={onClearFilters} tr={tr} />
      ) : (
        <NoMatch variant="search" tr={tr} />
      )
    }
    return (
      <div
        className={refreshing ? 'is-refreshing' : undefined}
        style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
      >
        {resultSummary}
        {clubs.map((c) => (
          <ClubCard
            key={c.id}
            club={c}
            selected={c.id === selId}
            onSelect={() => onSelect(c.id === selId ? null : c.id)}
            onOpen={() => onOpenClub(c.id)}
            onIntent={() => onPreloadClub(c.slug)}
            tr={tr}
          />
        ))}
      </div>
    )
  }

  // No runs on this day at all (no filters applied)
  if (allRuns.length === 0) {
    return <EmptyDay week={week} day={day} setDay={setDay} tr={tr} />
  }

  // Filters excluded all runs
  if (runs.length === 0) {
    return hasActiveFilters ? (
      <NoMatch onClearFilters={onClearFilters} tr={tr} />
    ) : hasSearchQuery ? (
      <NoMatch variant="search" tr={tr} />
    ) : (
      <EmptyDay week={week} day={day} setDay={setDay} tr={tr} />
    )
  }

  // Today's runs are all in the past
  const allPast =
    day === 0 &&
    runs.every((r) => r.status === 'CANCELLED' || toMin(r.time) < nowMin)
  if (allPast) {
    return <AllDoneNote week={week} setDay={setDay} tr={tr} />
  }

  return (
    <div
      className={refreshing ? 'is-refreshing' : undefined}
      style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
    >
      {resultSummary}
      {runs.map((r) => (
        <RunCard
          key={r.id}
          run={r}
          selected={r.id === selId}
          onSelect={() => onSelect(r.id === selId ? null : r.id)}
          onOpen={() => onOpenRun(r.id)}
          onIntent={() => onPreloadRun(r.id)}
          nowMin={nowMin}
          day={day}
          tr={tr}
        />
      ))}
    </div>
  )
}
