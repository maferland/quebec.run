import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useExploreRouting } from './use-explore-routing'

const push = vi.fn()
const replace = vi.fn()
const prefetch = vi.fn()
let pathname = '/fr'
let search = ''

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace, prefetch, back: vi.fn() }),
  usePathname: () => pathname,
  useSearchParams: () => new URLSearchParams(search),
}))

vi.mock('next-intl', () => ({ useLocale: () => 'fr' }))

const setup = (route = '/fr', query = '') => {
  pathname = route
  search = query
  const onNavigate = vi.fn()
  const hook = renderHook(() => useExploreRouting({ onNavigate }))
  return { ...hook, onNavigate }
}

beforeEach(() => {
  vi.spyOn(window.history, 'replaceState').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
  push.mockClear()
  replace.mockClear()
  prefetch.mockClear()
})

describe('reading state out of the URL', () => {
  it.each([
    { route: '/fr', mode: 'runs' },
    { route: '/fr/clubs', mode: 'clubs' },
    { route: '/fr/clubs/la-panthere', mode: 'clubs' },
  ])('derives mode $mode from $route', ({ route, mode }) => {
    expect(setup(route).result.current.mode).toBe(mode)
  })

  it('defaults to day zero', () => {
    expect(setup().result.current.day).toBe(0)
  })

  it('reads the day from the query', () => {
    expect(setup('/fr', 'day=3').result.current.day).toBe(3)
  })

  it('infers the day from a dated run id', () => {
    const { result } = setup('/fr/run/club-run--2026-07-28')
    expect(typeof result.current.day).toBe('number')
  })

  it('parses filters from the query', () => {
    const { result } = setup('/fr', 'beginner=1&pace=fast')
    expect(result.current.filters.beginner).toBe(true)
    expect(result.current.filters.pace).toBe('fast')
  })

  it.each([
    { route: '/fr', expected: null },
    { route: '/fr/run/run-1', expected: { kind: 'run', id: 'run-1' } },
    {
      route: '/fr/clubs/track',
      expected: { kind: 'club', slug: 'track' },
    },
  ])('derives currentDetail for $route', ({ route, expected }) => {
    expect(setup(route).result.current.currentDetail).toEqual(expected)
  })

  it('exposes the selected run and club', () => {
    expect(setup('/fr/run/run-1').result.current.selectedRunId).toBe('run-1')
    expect(setup('/fr/clubs/track').result.current.selectedClubSlug).toBe(
      'track'
    )
  })
})

describe('writing filter state', () => {
  it('keeps day changes out of the history stack', () => {
    const { result, onNavigate } = setup()

    act(() => result.current.setDay(2))

    expect(window.history.replaceState).toHaveBeenCalledWith(
      null,
      '',
      '/fr?day=2'
    )
    expect(replace).not.toHaveBeenCalled()
    expect(onNavigate).toHaveBeenCalled()
  })

  it('routes through the router when the mode changes', () => {
    const { result } = setup()

    act(() => result.current.setMode('clubs'))

    expect(replace).toHaveBeenCalledWith('/fr/clubs', { scroll: false })
  })

  it('routes through the router while a detail panel is open', () => {
    const { result } = setup('/fr/run/run-1')

    act(() => result.current.setDay(1))

    expect(replace).toHaveBeenCalled()
    expect(window.history.replaceState).not.toHaveBeenCalled()
  })

  it('applies a filter update function', () => {
    const { result } = setup()

    act(() =>
      result.current.setFilters((previous) => ({ ...previous, beginner: true }))
    )

    expect(window.history.replaceState).toHaveBeenCalledWith(
      null,
      '',
      '/fr?beginner=1'
    )
  })

  it('resets to the default filters', () => {
    const { result } = setup('/fr', 'beginner=1')

    act(() => result.current.clearFilters())

    expect(window.history.replaceState).toHaveBeenCalledWith(null, '', '/fr')
  })
})

describe('opening detail routes', () => {
  it('pushes a run URL carrying the current filters', () => {
    const { result } = setup('/fr', 'beginner=1')

    act(() => result.current.pushRunDetail('run-1'))

    expect(push).toHaveBeenCalledWith('/fr/run/run-1?beginner=1', {
      scroll: false,
    })
  })

  it('pushes a club URL carrying the current filters', () => {
    const { result } = setup('/fr/clubs', 'day=2')

    act(() => result.current.pushClubDetail('la-panthere'))

    expect(push).toHaveBeenCalledWith('/fr/clubs/la-panthere?day=2', {
      scroll: false,
    })
  })

  it('encodes slugs and ids', () => {
    const { result } = setup()

    act(() => result.current.pushClubDetail('a/b'))

    expect(push).toHaveBeenCalledWith('/fr/clubs/a%2Fb', { scroll: false })
  })

  it.each([
    {
      detail: { kind: 'club' as const, slug: 'x' },
      expected: '/fr/clubs?day=2',
    },
    { detail: { kind: 'run' as const, id: 'x' }, expected: '/fr?day=2' },
    {
      detail: { kind: 'place' as const, clubSlug: 'x', placeSlug: 'y' },
      expected: '/fr/clubs/x?day=2',
    },
    { detail: undefined, expected: '/fr?day=2' },
  ])('builds the $detail.kind fallback path', ({ detail, expected }) => {
    const { result } = setup('/fr', 'day=2')

    expect(result.current.detailFallbackPath(detail)).toBe(expected)
  })

  it('prefetches a locale-prefixed route', () => {
    const { result } = setup()

    act(() => result.current.prefetchRoute('/run/run-1'))

    expect(prefetch).toHaveBeenCalledWith('/fr/run/run-1')
  })
})

describe('switching locale', () => {
  it('swaps the locale segment and keeps the query', () => {
    const { result } = setup('/fr/clubs/la-panthere', 'day=2&beginner=1')

    act(() => result.current.switchLocale('en'))

    expect(push).toHaveBeenCalledWith('/en/clubs/la-panthere?day=2&beginner=1')
  })

  it('omits the question mark when there is no query', () => {
    const { result } = setup('/fr/clubs')

    act(() => result.current.switchLocale('en'))

    expect(push).toHaveBeenCalledWith('/en/clubs')
  })
})

describe('legacy query links', () => {
  it('rewrites ?club= to the path form', () => {
    setup('/fr', 'club=la-panthere')

    expect(replace).toHaveBeenCalledWith('/fr/clubs/la-panthere', {
      scroll: false,
    })
  })

  it('rewrites ?mode=clubs to the clubs path', () => {
    setup('/fr', 'mode=clubs')

    expect(replace).toHaveBeenCalledWith('/fr/clubs', { scroll: false })
  })

  it('rewrites ?run= to the run path', () => {
    setup('/fr', 'run=run-1')

    expect(replace).toHaveBeenCalledWith('/fr/run/run-1', { scroll: false })
  })

  it('leaves a canonical club path alone', () => {
    setup('/fr/clubs/la-panthere')

    expect(replace).not.toHaveBeenCalled()
  })
})
