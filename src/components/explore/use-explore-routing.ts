'use client'
import { useCallback, useEffect, useMemo, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import { DEFAULT_FILTERS, type Filters } from './filter-panel'
import {
  buildQs,
  dayOffsetFromRunId,
  parseDay,
  parseFilters,
  parseModeFromPath,
  parseRouteSelection,
  type DetailRoute,
  type Mode,
} from './explore-route'

type UrlUpdate = {
  day?: number
  mode?: Mode
  filters?: Filters
}

/** Reads explore state out of the URL and owns every write back to it. */
export function useExploreRouting({ onNavigate }: { onNavigate: () => void }) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const locale = useLocale()
  const [, startTransition] = useTransition()

  const routeSelection = parseRouteSelection(pathname)
  const mode = parseModeFromPath(pathname)
  const selectedRunId = routeSelection.runId ?? searchParams.get('run')
  const selectedClubSlug = routeSelection.clubSlug ?? searchParams.get('club')
  const day = searchParams.has('day')
    ? parseDay(searchParams)
    : (dayOffsetFromRunId(selectedRunId) ?? 0)
  const filters = useMemo(() => parseFilters(searchParams), [searchParams])
  const queryString = buildQs(day, filters)

  const currentDetail = useMemo<DetailRoute | null>(() => {
    if (routeSelection.runId) return { kind: 'run', id: routeSelection.runId }
    if (routeSelection.clubSlug && routeSelection.placeSlug) {
      return {
        kind: 'place',
        clubSlug: routeSelection.clubSlug,
        placeSlug: routeSelection.placeSlug,
      }
    }
    if (routeSelection.clubSlug)
      return { kind: 'club', slug: routeSelection.clubSlug }
    return null
  }, [routeSelection.clubSlug, routeSelection.placeSlug, routeSelection.runId])

  // Legacy ?mode=/?club=/?run= links get rewritten to their path equivalents.
  useEffect(() => {
    const queryMode = searchParams.get('mode')
    const queryClubSlug = searchParams.get('club')
    const queryRunId = searchParams.get('run')

    if (!routeSelection.clubSlug && (queryMode === 'clubs' || queryClubSlug)) {
      const path = queryClubSlug
        ? `/${locale}/clubs/${encodeURIComponent(queryClubSlug)}`
        : `/${locale}/clubs`
      router.replace(`${path}${queryString}`, { scroll: false })
      return
    }

    if (!routeSelection.runId && queryRunId) {
      router.replace(`/${locale}/run/${encodeURIComponent(queryRunId)}`, {
        scroll: false,
      })
    }
  }, [
    locale,
    queryString,
    routeSelection.clubSlug,
    routeSelection.runId,
    router,
    searchParams,
  ])

  // Day, mode and filter churn stays out of the history stack; anything that
  // leaves the current list behind clears the map selection first.
  const applyFilters = useCallback(
    (updates: UrlUpdate) => {
      onNavigate()
      const nextMode = updates.mode ?? mode
      const base = nextMode === 'clubs' ? `/${locale}/clubs` : `/${locale}`
      const url = `${base}${buildQs(updates.day ?? day, updates.filters ?? filters)}`
      if (nextMode === mode && !currentDetail) {
        window.history.replaceState(null, '', url)
        return
      }
      startTransition(() => router.replace(url, { scroll: false }))
    },
    [
      currentDetail,
      day,
      filters,
      locale,
      mode,
      onNavigate,
      router,
      startTransition,
    ]
  )

  const setDay = useCallback(
    (day: number) => applyFilters({ day }),
    [applyFilters]
  )

  const setMode = useCallback(
    (mode: Mode) => applyFilters({ mode }),
    [applyFilters]
  )

  const setFilters = useCallback(
    (update: (previous: Filters) => Filters) =>
      applyFilters({ filters: update(filters) }),
    [applyFilters, filters]
  )

  const clearFilters = useCallback(
    () => applyFilters({ filters: DEFAULT_FILTERS }),
    [applyFilters]
  )

  const pushRunDetail = useCallback(
    (id: string) => {
      const runDay = dayOffsetFromRunId(id) ?? day
      startTransition(() =>
        router.push(
          `/${locale}/run/${encodeURIComponent(id)}${buildQs(runDay, filters)}`,
          { scroll: false }
        )
      )
    },
    [day, filters, locale, router, startTransition]
  )

  const pushClubDetail = useCallback(
    (slug: string) => {
      startTransition(() =>
        router.push(
          `/${locale}/clubs/${encodeURIComponent(slug)}${queryString}`,
          { scroll: false }
        )
      )
    },
    [locale, queryString, router, startTransition]
  )

  const pushPlaceDetail = useCallback(
    (clubSlug: string, placeSlug: string) => {
      startTransition(() =>
        router.push(
          `/${locale}/clubs/${encodeURIComponent(clubSlug)}/events/${encodeURIComponent(placeSlug)}${queryString}`,
          { scroll: false }
        )
      )
    },
    [locale, queryString, router, startTransition]
  )

  const detailFallbackPath = useCallback(
    (detail: DetailRoute | undefined) => {
      if (detail?.kind === 'club') return `/${locale}/clubs${queryString}`
      if (detail?.kind === 'place')
        return `/${locale}/clubs/${detail.clubSlug}${queryString}`
      return `/${locale}${queryString}`
    },
    [locale, queryString]
  )

  // Returns the href rather than navigating, so the switcher can be a real
  // link and keep working before React hydrates.
  const localeHref = useCallback(
    (nextLocale: 'fr' | 'en') => {
      const segments = pathname.split('/')
      segments[1] = nextLocale
      const qs = searchParams.toString()
      return `${segments.join('/')}${qs ? `?${qs}` : ''}`
    },
    [pathname, searchParams]
  )

  const prefetchRoute = useCallback(
    (path: string) => router.prefetch(`/${locale}${path}`),
    [locale, router]
  )

  return {
    locale,
    mode,
    day,
    filters,
    selectedRunId,
    selectedClubSlug,
    currentDetail,
    detailFallbackPath,
    setDay,
    setMode,
    setFilters,
    clearFilters,
    pushRunDetail,
    pushClubDetail,
    pushPlaceDetail,
    prefetchRoute,
    localeHref,
  }
}
