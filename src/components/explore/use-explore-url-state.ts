'use client'
import { useCallback, useEffect, useMemo, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import type { Filters } from './filter-panel'
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

export type UrlUpdate = {
  day?: number
  mode?: Mode
  filters?: Filters
  runId?: string | null
  clubSlug?: string | null
}

export function useExploreUrlState() {
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

  const currentDetail = useMemo<DetailRoute | null>(() => {
    if (routeSelection.runId) return { kind: 'run', id: routeSelection.runId }
    if (routeSelection.clubSlug)
      return { kind: 'club', slug: routeSelection.clubSlug }
    return null
  }, [routeSelection.clubSlug, routeSelection.runId])

  // Legacy ?mode=/?club=/?run= links get rewritten to their path equivalents.
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
    (updates: UrlUpdate) => {
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
      // Filter and day churn stays out of the history stack.
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

  return {
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
  }
}
