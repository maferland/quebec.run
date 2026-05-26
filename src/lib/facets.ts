export type FacetKey = 'openPace' | 'morning' | 'evening' | 'weekend'
export type FacetParam = 'pacePolicy' | 'timeOfDay' | 'weekend'

export type FacetDef = {
  key: FacetKey
  param: FacetParam
  value: 'OPEN_PACE' | 'morning' | 'evening' | '1'
}

// Single source of truth for the four event facets. Service uses this to
// compute counts; the filter component uses it to render the chip row.
export const EVENT_FACETS: readonly FacetDef[] = [
  { key: 'openPace', param: 'pacePolicy', value: 'OPEN_PACE' },
  { key: 'morning', param: 'timeOfDay', value: 'morning' },
  { key: 'evening', param: 'timeOfDay', value: 'evening' },
  { key: 'weekend', param: 'weekend', value: '1' },
] as const
