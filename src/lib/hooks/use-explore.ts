import {
  keepPreviousData,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'
import { useMemo } from 'react'
import type { ClubDetailData } from '@/components/explore/club-detail'
import type { RunDetailData } from '@/components/explore/run-detail'
import type { RunDetailResponse } from '@/lib/schemas'
import type { ClubForDetail, ExploreClub } from '@/lib/services/clubs'
import type { ExploreRun } from '@/lib/services/events'
import { isRunPast } from '@/lib/utils/run-time'

export type WeekCount = { day: number; count: number }
// Close enough to the `revalidate = 900` on the explore routes that a remount
// reuses the cache instead of refetching.
const STALE_TIME = 5 * 60 * 1000

export const exploreKeys = {
  weekCounts: () => ['explore', 'week-counts'] as const,
  runs: (day: number) => ['explore', 'runs', { day }] as const,
  clubs: () => ['explore', 'clubs'] as const,
  runDetail: (id: string) => ['explore', 'run-detail', { id }] as const,
  clubDetail: (slug: string, locale: string) =>
    ['explore', 'club-detail', { slug, locale }] as const,
}

async function getJson<T>(url: string, errorMessage: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(errorMessage)
  return response.json() as Promise<T>
}

function toRunDetail(data: RunDetailResponse): RunDetailData {
  return {
    id: data.id,
    title: data.title,
    time: data.time,
    date: data.date,
    isPast: isRunPast(data.date, data.time, new Date()),
    status: data.status,
    // A run states either a fixed distance or a pace; neither is guaranteed.
    distance: data.distance ?? data.pace,
    pacePolicy: data.pacePolicy,
    address: data.address,
    lat: data.latitude,
    lng: data.longitude,
    club: data.club,
  }
}

function toClubDetail(data: ClubForDetail): ClubDetailData {
  return {
    id: data.id,
    slug: data.slug,
    name: data.name,
    type: data.type,
    vibe: data.vibe,
    beginnerFriendly: data.beginnerFriendly,
    paceMin: data.paceMin,
    paceMax: data.paceMax,
    description: data.description,
    instagram: data.instagram,
    website: data.website,
    schedule: data.schedule,
    upcomingRuns: (data.upcomingRuns ?? []).map((run) => ({
      ...run,
      date: run.date instanceof Date ? run.date.toISOString() : run.date,
    })),
  }
}

// `retry: false` keeps a missing run or club on the error panel immediately
// instead of sitting on the skeleton through three backoffs.
const runDetailQuery = (id: string) => ({
  queryKey: exploreKeys.runDetail(id),
  queryFn: async () =>
    toRunDetail(
      await getJson<RunDetailResponse>(
        `/api/explore/runs/${id}`,
        'Run not found'
      )
    ),
  staleTime: STALE_TIME,
  retry: false,
})

const clubDetailQuery = (slug: string, locale: string) => ({
  queryKey: exploreKeys.clubDetail(slug, locale),
  queryFn: async () =>
    toClubDetail(
      await getJson<ClubForDetail>(
        `/api/explore/clubs/${slug}?locale=${locale}`,
        'Club not found'
      )
    ),
  staleTime: STALE_TIME,
  retry: false,
})

export function useWeekCounts(initialData?: WeekCount[]) {
  return useQuery({
    queryKey: exploreKeys.weekCounts(),
    queryFn: () =>
      getJson<WeekCount[]>(
        '/api/explore/week-counts',
        'Failed to load week counts'
      ),
    initialData,
    staleTime: STALE_TIME,
  })
}

export function useExploreRuns({
  day,
  initialData,
}: {
  day: number
  initialData?: ExploreRun[]
}) {
  return useQuery({
    queryKey: exploreKeys.runs(day),
    queryFn: () =>
      getJson<ExploreRun[]>(
        `/api/explore/runs?day=${day}`,
        'Failed to load runs'
      ),
    initialData,
    placeholderData: keepPreviousData,
    staleTime: STALE_TIME,
  })
}

export function useExploreClubs(initialData?: ExploreClub[]) {
  return useQuery({
    queryKey: exploreKeys.clubs(),
    queryFn: () =>
      getJson<ExploreClub[]>('/api/explore/clubs', 'Failed to load clubs'),
    initialData,
    staleTime: STALE_TIME,
  })
}

export function useRunDetail(id: string | null) {
  return useQuery({ ...runDetailQuery(id ?? ''), enabled: Boolean(id) })
}

export function useClubDetail(slug: string | null, locale: string) {
  return useQuery({
    ...clubDetailQuery(slug ?? '', locale),
    enabled: Boolean(slug),
  })
}

export function useDetailPrefetch(locale: string) {
  const client: QueryClient = useQueryClient()

  return useMemo(
    () => ({
      prefetchRun: (id: string) =>
        void client.prefetchQuery(runDetailQuery(id)),
      prefetchClub: (slug: string) =>
        void client.prefetchQuery(clubDetailQuery(slug, locale)),
    }),
    [client, locale]
  )
}
