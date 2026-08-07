import { format } from 'date-fns'
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'
import { useMemo } from 'react'
import type { ClubDetailData } from '@/components/explore/club-detail'
import type { RunDetailData } from '@/components/explore/run-detail'
import type { PlaceDetailData } from '@/components/explore/place-detail'
import type { RunDetailResponse } from '@/lib/schemas'
import type { ClubForDetail, ExploreClub } from '@/lib/services/clubs'
import type { ExploreRun } from '@/lib/services/events'
import type { PlacePage } from '@/lib/services/recurring-events'
import { describePattern } from '@/lib/utils/rrule-builder'
import { formatEventDate } from '@/lib/utils/date-formatting'
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
  placeDetail: (clubSlug: string, placeSlug: string, locale: string) =>
    ['explore', 'place-detail', { clubSlug, placeSlug, locale }] as const,
}

const UPCOMING_SHOWN = 6
const OTHER_PLACES_SHOWN = 6

const capitalize = (value: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : value

// Pattern titles carry the club name ("6AM Club Limoilou"); a list of them
// repeats it once per link, which is the keyword noise the place page trims.
function placeLabel(
  place: { title: string; neighborhood: string | null },
  clubName: string
): string {
  return (
    place.neighborhood ??
    (place.title.startsWith(clubName)
      ? place.title.slice(clubName.length).trim() || place.title
      : place.title)
  )
}

async function getJson<T>(url: string, errorMessage: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(errorMessage)
  return response.json() as Promise<T>
}

export function toRunDetail(data: RunDetailResponse): RunDetailData {
  return {
    id: data.id,
    title: data.title,
    // Recurring patterns describe their meeting spot, which the address already
    // covers; only a one-off says something the rest of the panel doesn't.
    description: data.kind === 'one-off' ? data.description : null,
    time: data.time,
    date: data.date,
    isPast: isRunPast(data.date, data.time, new Date()),
    status: data.status,
    distance: data.distance,
    // A run can set its own pace; otherwise the club's range stands in.
    pace: data.pace,
    pacePolicy: data.pacePolicy,
    address: data.address,
    lat: data.latitude,
    lng: data.longitude,
    club: data.club,
  }
}

export function toClubDetail(data: ClubForDetail): ClubDetailData {
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

export function toPlaceDetail(
  place: PlacePage,
  locale: 'fr' | 'en'
): PlaceDetailData {
  const dateLocale = locale === 'fr' ? 'fr-CA' : 'en-CA'
  const schedules = place.slots.flatMap((slot) => {
    const described = describePattern(slot.schedulePattern, locale)
    return described ? [described] : []
  })

  const upcoming = place.slots
    .flatMap((slot) =>
      slot.occurrences.map((date) => ({ date, slug: slot.slug }))
    )
    .sort((first, second) => first.date.getTime() - second.date.getTime())
    .slice(0, UPCOMING_SHOWN)

  return {
    clubSlug: place.club.slug,
    clubName: place.club.name,
    clubDescription: place.club.description,
    heading: place.slots[0]?.title ?? place.club.name,
    schedule: schedules.join(' · '),
    address: place.place.address,
    neighborhood: place.place.neighborhood,
    lat: place.place.latitude,
    lng: place.place.longitude,
    slots: place.slots.map((slot) => ({
      id: slot.id,
      title: slot.title,
      schedule: describePattern(slot.schedulePattern, locale),
      distance: slot.distance,
      pace: slot.pace,
      pacePolicy: slot.pacePolicy,
    })),
    upcoming: upcoming.map((occurrence) => ({
      slug: occurrence.slug,
      date: format(occurrence.date, 'yyyy-MM-dd'),
      label: capitalize(
        formatEventDate(occurrence.date, 'abbreviated', {
          locale: dateLocale,
        })
      ),
    })),
    otherPlaces: place.otherPlaces
      .slice(0, OTHER_PLACES_SHOWN)
      .map((other) => ({
        slug: other.slug,
        label: placeLabel(other, place.club.name),
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

const placeDetailQuery = (
  clubSlug: string,
  placeSlug: string,
  locale: string
) => ({
  queryKey: exploreKeys.placeDetail(clubSlug, placeSlug, locale),
  queryFn: () =>
    getJson<PlaceDetailData>(
      `/api/explore/places/${clubSlug}/${placeSlug}?locale=${locale}`,
      'Place not found'
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

export function usePlaceDetail(
  clubSlug: string | null,
  placeSlug: string | null,
  locale: string
) {
  return useQuery({
    ...placeDetailQuery(clubSlug ?? '', placeSlug ?? '', locale),
    enabled: Boolean(clubSlug) && Boolean(placeSlug),
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
      prefetchPlace: (clubSlug: string, placeSlug: string) =>
        void client.prefetchQuery(
          placeDetailQuery(clubSlug, placeSlug, locale)
        ),
    }),
    [client, locale]
  )
}
