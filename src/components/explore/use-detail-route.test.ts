import { act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@/lib/test-utils'
import type { DetailRoute } from './explore-route'
import { useDetailRoute } from './use-detail-route'

const back = vi.fn()
const replace = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace, back }),
}))

const buildFallbackPath = (detail: DetailRoute | null) =>
  detail?.kind === 'club' ? '/fr/clubs' : '/fr'

const setup = (currentDetail: DetailRoute | null) =>
  renderHook(
    ({ detail }: { detail: DetailRoute | null }) =>
      useDetailRoute({ currentDetail: detail, buildFallbackPath }),
    { initialProps: { detail: currentDetail } }
  )

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.useRealTimers()
  back.mockClear()
  replace.mockClear()
})

const RUN: DetailRoute = { kind: 'run', id: 'run-1' }
const OTHER_RUN: DetailRoute = { kind: 'run', id: 'run-2' }
const CLUB: DetailRoute = { kind: 'club', slug: 'track' }

describe('useDetailRoute', () => {
  it('adopts a detail route present on first render without animating in', () => {
    const { result } = setup(RUN)

    expect(result.current.overlay).toMatchObject({
      kind: 'run',
      id: 'run-1',
      enter: false,
      exiting: false,
      closeMode: 'route',
    })
    expect(result.current.previousOverlay).toBeNull()
  })

  it('starts with no overlay when the route has no detail', () => {
    const { result } = setup(null)

    expect(result.current.overlay).toBeNull()
  })

  it('opens a detail optimistically with the enter animation', () => {
    const { result } = setup(null)

    act(() => result.current.openDetail(CLUB))

    expect(result.current.overlay).toMatchObject({
      kind: 'club',
      slug: 'track',
      enter: true,
      exiting: false,
    })
  })

  it('replaces the route with the fallback path when closing to route', () => {
    const { result } = setup(RUN)

    act(() => result.current.requestExit('route'))
    expect(result.current.overlay?.exiting).toBe(true)
    expect(replace).not.toHaveBeenCalled()

    act(() => result.current.completeExit())

    expect(replace).toHaveBeenCalledWith('/fr', { scroll: false })
    expect(result.current.overlay).toBeNull()
  })

  it('uses the club fallback path for a club overlay', () => {
    const { result } = setup(CLUB)

    act(() => result.current.requestExit('route'))
    act(() => result.current.completeExit())

    expect(replace).toHaveBeenCalledWith('/fr/clubs', { scroll: false })
  })

  it('pops browser history when closing to history', () => {
    const { result } = setup(RUN)

    act(() => result.current.requestExit('history'))
    act(() => result.current.completeExit())

    expect(back).toHaveBeenCalled()
    expect(replace).not.toHaveBeenCalled()
  })

  it('re-adopts the panel if it closes while the route still points at it', () => {
    const { result } = setup(RUN)

    act(() => result.current.requestExit())
    act(() => result.current.completeExit())

    expect(back).not.toHaveBeenCalled()
    expect(replace).not.toHaveBeenCalled()
    expect(result.current.overlay).toMatchObject({
      kind: 'run',
      id: 'run-1',
      exiting: false,
    })
  })

  it('completes the exit on its own if the animation never reports back', () => {
    const { result } = setup(RUN)

    act(() => result.current.requestExit('route'))
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(replace).toHaveBeenCalledWith('/fr', { scroll: false })
  })

  it('keeps the outgoing panel around while the next one enters', () => {
    const { result, rerender } = setup(RUN)

    rerender({ detail: CLUB })

    expect(result.current.overlay).toMatchObject({
      kind: 'club',
      slug: 'track',
    })
    expect(result.current.previousOverlay).toMatchObject({
      kind: 'run',
      id: 'run-1',
      exiting: false,
      enter: false,
    })

    act(() => result.current.completeEnter())
    expect(result.current.previousOverlay).toBeNull()
  })

  it('drops the outgoing panel on its own if the enter never reports back', () => {
    const { result, rerender } = setup(RUN)

    rerender({ detail: CLUB })
    expect(result.current.previousOverlay).not.toBeNull()

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(result.current.previousOverlay).toBeNull()
  })

  it('returns to the previous panel instead of the map after a nested jump', () => {
    const { result, rerender } = setup(RUN)

    // navigating detail-to-detail records the run so Back can return to it
    rerender({ detail: OTHER_RUN })
    act(() => result.current.completeEnter())

    act(() => result.current.requestExit('history'))

    expect(back).toHaveBeenCalled()
    // no exit animation: the panel stays until the popped route arrives
    expect(result.current.overlay?.exiting).toBeFalsy()

    rerender({ detail: RUN })
    expect(result.current.overlay).toMatchObject({ kind: 'run', id: 'run-1' })
    expect(result.current.previousOverlay).toMatchObject({
      kind: 'run',
      id: 'run-2',
    })
  })

  it('animates the panel out when the route loses its detail', () => {
    const { result, rerender } = setup(RUN)

    rerender({ detail: null })

    expect(result.current.overlay?.exiting).toBe(true)

    act(() => result.current.completeExit())
    expect(result.current.overlay).toBeNull()
  })

  it('marks a detail opened optimistically as history-closable once the route lands', () => {
    const { result, rerender } = setup(null)

    act(() => result.current.openDetail(RUN))
    expect(result.current.overlay?.closeMode).toBe('route')

    rerender({ detail: RUN })

    expect(result.current.overlay?.closeMode).toBe('history')
  })

  it('clears its pending timers on unmount', () => {
    const clearTimeout = vi.spyOn(window, 'clearTimeout')
    const { result, unmount } = setup(RUN)

    act(() => result.current.requestExit('route'))
    unmount()

    expect(clearTimeout).toHaveBeenCalled()
  })
})
