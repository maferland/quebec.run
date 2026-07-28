import { act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderHook } from '@/lib/test-utils'
import { useExploreSearch, useSheetDrag } from './use-explore-layout'

const CONTAINER = 1000
const SNAPS = { peek: 340, mid: 600, full: 930 }

const pointerEvent = (clientY: number) =>
  ({
    clientY,
    pointerId: 1,
    currentTarget: { setPointerCapture: vi.fn() },
  }) as unknown as React.PointerEvent

const drag = (
  handlers: ReturnType<typeof useSheetDrag>['gripHandlers'],
  from: number,
  to: number
) => {
  act(() => handlers.onPointerDown(pointerEvent(from)))
  act(() => handlers.onPointerMove(pointerEvent(to)))
  act(() => handlers.onPointerUp())
}

describe('useSheetDrag', () => {
  it('centres the sheet once the container is measured', () => {
    const { result } = renderHook(() => useSheetDrag(CONTAINER))

    expect(result.current.height).toBe(SNAPS.mid)
  })

  it('stays collapsed while the container has no height', () => {
    const { result } = renderHook(() => useSheetDrag(0))

    expect(result.current.height).toBe(0)
  })

  it('grows the sheet as the grip is dragged up', () => {
    const { result } = renderHook(() => useSheetDrag(CONTAINER))

    act(() => result.current.gripHandlers.onPointerDown(pointerEvent(400)))
    act(() => result.current.gripHandlers.onPointerMove(pointerEvent(200)))

    expect(result.current.height).toBe(SNAPS.mid + 200)
    expect(result.current.dragging).toBe(true)
  })

  it('keeps the snap point chosen by the drag instead of recentring', () => {
    const { result } = renderHook(() => useSheetDrag(CONTAINER))

    drag(result.current.gripHandlers, 400, 100)

    expect(result.current.height).toBe(SNAPS.full)
    expect(result.current.dragging).toBe(false)
  })

  it('snaps down to peek when dragged to the bottom', () => {
    const { result } = renderHook(() => useSheetDrag(CONTAINER))

    drag(result.current.gripHandlers, 400, 900)

    expect(result.current.height).toBe(SNAPS.peek)
  })

  it('clamps the drag to the peek and full bounds', () => {
    const { result } = renderHook(() => useSheetDrag(CONTAINER))

    act(() => result.current.gripHandlers.onPointerDown(pointerEvent(400)))
    act(() => result.current.gripHandlers.onPointerMove(pointerEvent(-5000)))
    expect(result.current.height).toBe(SNAPS.full)

    act(() => result.current.gripHandlers.onPointerMove(pointerEvent(5000)))
    expect(result.current.height).toBe(SNAPS.peek)
  })

  it('ignores pointer movement that did not start on the grip', () => {
    const { result } = renderHook(() => useSheetDrag(CONTAINER))

    act(() => result.current.gripHandlers.onPointerMove(pointerEvent(100)))

    expect(result.current.height).toBe(SNAPS.mid)
  })

  it('recentres when the container resizes', () => {
    const { result, rerender } = renderHook(
      ({ height }: { height: number }) => useSheetDrag(height),
      { initialProps: { height: CONTAINER } }
    )

    drag(result.current.gripHandlers, 400, 100)
    expect(result.current.height).toBe(SNAPS.full)

    rerender({ height: 500 })

    expect(result.current.height).toBe(300)
  })
})

describe('useExploreSearch', () => {
  it('starts closed and empty', () => {
    const { result } = renderHook(() => useExploreSearch())

    expect(result.current.open).toBe(false)
    expect(result.current.query).toBe('')
  })

  it('clears the query when closed', () => {
    const { result } = renderHook(() => useExploreSearch())

    act(() => result.current.setOpen(true))
    act(() => result.current.setQuery('track'))
    expect(result.current.query).toBe('track')

    act(() => result.current.close())

    expect(result.current.open).toBe(false)
    expect(result.current.query).toBe('')
  })

  it('focuses the input on the frame after opening', () => {
    const frame = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb) => {
        cb(0)
        return 1
      })
    const input = document.createElement('input')
    document.body.appendChild(input)

    const { result } = renderHook(() => useExploreSearch())
    result.current.inputRef.current = input

    act(() => result.current.setOpen(true))

    expect(document.activeElement).toBe(input)

    input.remove()
    frame.mockRestore()
  })
})
