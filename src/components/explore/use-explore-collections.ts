'use client'
import { useMemo } from 'react'
import type { MapPoint } from './map-view'
import type { Mode } from './explore-route'
import { clubMatches, runMatches, type Filters } from './filter-panel'
import type { RunDetailData } from './run-detail'
import type { ExploreClub } from '@/lib/services/clubs'
import type { ExploreRun } from '@/lib/services/events'
import { foldAccents, foldedIncludes } from '@/lib/utils/intl'
import { isRunTimePast } from '@/lib/utils/run-time'

function matchesQuery(
  haystack: (string | null | undefined)[],
  foldedQuery: string
) {
  return haystack.some((value) => foldedIncludes(value, foldedQuery))
}

type RunLike = {
  id: string
  time: string
  status: 'SCHEDULED' | 'CANCELLED'
  lat: number | null
  lng: number | null
}

// Returns null rather than asserting: a run or club without coordinates simply
// has no marker.
function runPoint(run: RunLike, past: boolean): MapPoint | null {
  if (run.lat === null || run.lng === null) return null
  return {
    id: run.id,
    lat: run.lat,
    lng: run.lng,
    kind: 'run',
    label: run.time,
    cancelled: run.status === 'CANCELLED',
    past,
  }
}

function clubPoint(club: ExploreClub): MapPoint | null {
  if (club.lat === null || club.lng === null) return null
  return {
    id: club.id,
    lat: club.lat,
    lng: club.lng,
    kind: 'club',
    label: club.name,
  }
}

const compact = <T>(items: (T | null)[]): T[] =>
  items.flatMap((item) => (item ? [item] : []))

export function useExploreCollections({
  runs,
  clubs,
  filters,
  searchQuery,
  mode,
  day,
  nowMin,
  selectedRun,
  selectedClubSlug,
}: {
  runs: ExploreRun[]
  clubs: ExploreClub[]
  filters: Filters
  searchQuery: string
  mode: Mode
  day: number
  nowMin: number
  selectedRun: RunDetailData | undefined
  selectedClubSlug: string | null
}) {
  const query = foldAccents(searchQuery.trim())

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

  // Keeps the open run pinned even when the day's list does not contain it.
  const selectedRunPoint = useMemo(
    () =>
      selectedRun ? runPoint(selectedRun, Boolean(selectedRun.isPast)) : null,
    [selectedRun]
  )

  const points = useMemo((): MapPoint[] => {
    if (mode === 'clubs') {
      return compact(filteredClubs.map(clubPoint))
    }
    const runPoints = compact(
      filteredRuns.map((run) =>
        runPoint(
          run,
          day === 0 &&
            run.status !== 'CANCELLED' &&
            isRunTimePast(run.time, nowMin)
        )
      )
    )
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

  const nextRunId = useMemo(
    () =>
      filteredRuns.find(
        (run) => run.status !== 'CANCELLED' && !isRunTimePast(run.time, nowMin)
      )?.id ?? null,
    [filteredRuns, nowMin]
  )

  return {
    filteredRuns,
    filteredClubs,
    points,
    selectedClubId,
    nextRunId,
    runCount: filteredRuns.length,
    clubCount: filteredClubs.length,
    hasSearchQuery: query.length > 0,
  }
}
