import { describe, expect, it } from 'vitest'
import { renderHook } from '@/lib/test-utils'
import { DEFAULT_FILTERS } from './filter-panel'
import type { ExploreClub } from '@/lib/services/clubs'
import type { ExploreRun } from '@/lib/services/events'
import { useExploreCollections } from './use-explore-collections'

const club = (over: Partial<ExploreClub> = {}): ExploreClub => ({
  id: 'club-1',
  slug: 'la-panthere',
  name: 'La Panthère',
  type: 'ROAD',
  vibe: 'SOCIAL',
  beginnerFriendly: false,
  paceMin: null,
  paceMax: null,
  description: 'Club de course à Québec',
  website: null,
  instagram: null,
  facebook: null,
  memberCount: 0,
  lat: 46.81,
  lng: -71.21,
  ...over,
})

const run = (over: Partial<ExploreRun> = {}): ExploreRun => ({
  id: 'run-1',
  title: 'Intervalles',
  time: '18:00',
  status: 'SCHEDULED',
  lat: 46.8,
  lng: -71.2,
  distance: '5',
  isPast: false,
  address: 'Grande Allée',
  neighborhood: null,
  club: {
    id: 'club-1',
    slug: 'la-panthere',
    name: 'La Panthère',
    type: 'ROAD',
    vibe: 'SOCIAL',
    beginnerFriendly: false,
    paceMin: null,
    paceMax: null,
  },
  ...over,
})

const setup = (
  over: Partial<Parameters<typeof useExploreCollections>[0]> = {}
) =>
  renderHook(() =>
    useExploreCollections({
      runs: [run()],
      clubs: [club()],
      filters: DEFAULT_FILTERS,
      searchQuery: '',
      mode: 'runs',
      day: 1,
      nowMin: 0,
      selectedRun: undefined,
      selectedClubSlug: null,
      ...over,
    })
  )

describe('useExploreCollections', () => {
  it('passes everything through with no filters or query', () => {
    const { result } = setup()

    expect(result.current.runCount).toBe(1)
    expect(result.current.clubCount).toBe(1)
    expect(result.current.hasSearchQuery).toBe(false)
  })

  it.each([
    { query: 'intervalles', field: 'title' },
    { query: 'panthere', field: 'club name, unaccented' },
    { query: 'Panthère', field: 'club name, accented' },
    { query: 'grande allee', field: 'address, unaccented' },
  ])('matches a run by $field', ({ query }) => {
    const { result } = setup({ searchQuery: query })

    expect(result.current.runCount).toBe(1)
    expect(result.current.hasSearchQuery).toBe(true)
  })

  it('drops runs that match nothing', () => {
    const { result } = setup({ searchQuery: 'zzzz' })

    expect(result.current.runCount).toBe(0)
  })

  it.each([
    { query: 'panthere', field: 'name, unaccented' },
    { query: 'quebec', field: 'description, unaccented' },
  ])('matches a club by $field', ({ query }) => {
    const { result } = setup({ mode: 'clubs', searchQuery: query })

    expect(result.current.clubCount).toBe(1)
  })

  it('treats a whitespace-only query as empty', () => {
    const { result } = setup({ searchQuery: '   ' })

    expect(result.current.hasSearchQuery).toBe(false)
    expect(result.current.runCount).toBe(1)
  })

  it('builds club points in clubs mode', () => {
    const { result } = setup({ mode: 'clubs' })

    expect(result.current.points).toEqual([
      {
        id: 'club-1',
        lat: 46.81,
        lng: -71.21,
        kind: 'club',
        label: 'La Panthère',
      },
    ])
  })

  it('builds run points in runs mode', () => {
    const { result } = setup()

    expect(result.current.points).toMatchObject([
      { id: 'run-1', kind: 'run', label: '18:00', cancelled: false },
    ])
  })

  it('skips items with no coordinates', () => {
    const { result } = setup({ runs: [run({ lat: null, lng: null })] })

    expect(result.current.points).toEqual([])
    expect(result.current.runCount).toBe(1)
  })

  it('marks a run past only for today', () => {
    const today = setup({ day: 0, nowMin: 20 * 60 })
    expect(today.result.current.points[0].past).toBe(true)

    const tomorrow = setup({ day: 1, nowMin: 20 * 60 })
    expect(tomorrow.result.current.points[0].past).toBe(false)
  })

  it('never marks a cancelled run as past', () => {
    const { result } = setup({
      runs: [run({ status: 'CANCELLED' })],
      day: 0,
      nowMin: 20 * 60,
    })

    expect(result.current.points[0]).toMatchObject({
      cancelled: true,
      past: false,
    })
  })

  it('pins the open run even when the day list excludes it', () => {
    const { result } = setup({
      runs: [],
      selectedRun: {
        id: 'run-9',
        title: 'Sortie',
        time: '06:00',
        date: '2026-07-29',
        isPast: false,
        status: 'SCHEDULED',
        distance: null,
        pacePolicy: null,
        address: null,
        lat: 46.7,
        lng: -71.3,
        club: {
          id: 'club-1',
          slug: 'la-panthere',
          name: 'La Panthère',
          description: null,
          type: null,
          vibe: null,
          beginnerFriendly: false,
          paceMin: null,
          paceMax: null,
        },
      },
    })

    expect(result.current.points).toMatchObject([{ id: 'run-9', kind: 'run' }])
  })

  it('resolves the selected club slug to its id', () => {
    const { result } = setup({ selectedClubSlug: 'la-panthere' })

    expect(result.current.selectedClubId).toBe('club-1')
  })

  it.each([
    { slug: null, expected: null },
    { slug: 'no-such-club', expected: null },
  ])('returns $expected for slug $slug', ({ slug, expected }) => {
    const { result } = setup({ selectedClubSlug: slug })

    expect(result.current.selectedClubId).toBe(expected)
  })

  it('reports the first upcoming run as the scroll target', () => {
    const { result } = setup({
      runs: [
        run({ id: 'early', time: '06:00' }),
        run({ id: 'late', time: '19:00' }),
      ],
      nowMin: 7 * 60,
    })

    expect(result.current.nextRunId).toBe('late')
  })

  it('has no scroll target once every run has passed', () => {
    const { result } = setup({ nowMin: 23 * 60 })

    expect(result.current.nextRunId).toBeNull()
  })

  it('skips a cancelled run when picking the scroll target', () => {
    const { result } = setup({
      runs: [
        run({ id: 'cancelled', time: '19:00', status: 'CANCELLED' }),
        run({ id: 'ok', time: '20:00' }),
      ],
      nowMin: 7 * 60,
    })

    expect(result.current.nextRunId).toBe('ok')
  })
})
