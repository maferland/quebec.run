// Single source of truth for the facets exposed on /events, /calendar, /clubs.
// Service computes counts off these; filter components render chips off these.

export type FacetDef<TKey extends string, TParam extends string> = {
  key: TKey
  param: TParam
  value: string
}

// Event facets — shared by /events and /calendar
export type EventFacetKey =
  | 'openPace'
  | 'morning'
  | 'evening'
  | 'weekend'
  | 'social'
  | 'training'
  | 'beginner'
  | 'showPast'
export type EventFacetParam =
  | 'pacePolicy'
  | 'timeOfDay'
  | 'weekend'
  | 'clubVibe'
  | 'beginner'
  | 'showPast'
export type EventFacetDef = FacetDef<EventFacetKey, EventFacetParam>

// Back-compat aliases for the older single-purpose names used elsewhere.
export type FacetKey = EventFacetKey
export type FacetParam = EventFacetParam

export const EVENT_FACETS: readonly EventFacetDef[] = [
  { key: 'openPace', param: 'pacePolicy', value: 'OPEN_PACE' },
  { key: 'morning', param: 'timeOfDay', value: 'morning' },
  { key: 'evening', param: 'timeOfDay', value: 'evening' },
  { key: 'weekend', param: 'weekend', value: '1' },
  { key: 'social', param: 'clubVibe', value: 'SOCIAL' },
  { key: 'training', param: 'clubVibe', value: 'TRAINING' },
  { key: 'beginner', param: 'beginner', value: '1' },
  { key: 'showPast', param: 'showPast', value: '1' },
] as const

// Club facets — /clubs
export type ClubFacetKey = 'road' | 'trail' | 'social' | 'training' | 'beginner'
export type ClubFacetParam = 'type' | 'vibe' | 'beginner'
export type ClubFacetDef = FacetDef<ClubFacetKey, ClubFacetParam>

export const CLUB_FACETS: readonly ClubFacetDef[] = [
  { key: 'road', param: 'type', value: 'ROAD' },
  { key: 'trail', param: 'type', value: 'TRAIL' },
  { key: 'social', param: 'vibe', value: 'SOCIAL' },
  { key: 'training', param: 'vibe', value: 'TRAINING' },
  { key: 'beginner', param: 'beginner', value: '1' },
] as const

export function createEmptyFacetCounts<TKey extends string>(
  facets: readonly { key: TKey }[]
): Record<TKey, number> {
  const counts = {} as Record<TKey, number>
  for (const facet of facets) counts[facet.key] = 0
  return counts
}
