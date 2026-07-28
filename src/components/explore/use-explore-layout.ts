'use client'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { getTorontoMinutes } from '@/lib/utils/run-time'

const DESKTOP_MIN_WIDTH = 880

const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect

export function useContainerMetrics<T extends HTMLElement>() {
  const rootRef = useRef<T>(null)
  const [desktop, setDesktop] = useState(false)
  const [height, setHeight] = useState(0)

  // Measured before paint: a locale switch remounts this tree, and waiting for
  // the async ResizeObserver left frames with the map unmounted.
  useIsomorphicLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    const measure = () => {
      setDesktop(el.clientWidth >= DESKTOP_MIN_WIDTH)
      setHeight(el.clientHeight)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return { rootRef, desktop, height }
}

export function useNowMinutes() {
  const [nowMin, setNowMin] = useState(() => getTorontoMinutes())

  useEffect(() => {
    const updateNow = () => setNowMin(getTorontoMinutes())
    updateNow()
    const interval = window.setInterval(updateNow, 60_000)
    return () => window.clearInterval(interval)
  }, [])

  return nowMin
}

export function useSheetDrag(containerHeight: number) {
  const [dragging, setDragging] = useState(false)
  // Tagged with the container it was measured against, so a resize recentres
  // without an effect and the first paint already has the height.
  const [dragged, setDragged] = useState<{ height: number; of: number } | null>(
    null
  )
  const dragRef = useRef<{ y: number; h: number } | null>(null)

  const snaps = useMemo(
    () => ({
      peek: Math.round(containerHeight * 0.34),
      mid: Math.round(containerHeight * 0.6),
      full: Math.round(containerHeight * 0.93),
    }),
    [containerHeight]
  )

  const height = dragged?.of === containerHeight ? dragged.height : snaps.mid

  const setHeight = useCallback(
    (next: number) => setDragged({ height: next, of: containerHeight }),
    [containerHeight]
  )

  const onPointerDown = useCallback(
    (event: React.PointerEvent) => {
      dragRef.current = { y: event.clientY, h: height }
      setDragging(true)
      try {
        ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
      } catch {}
    },
    [height]
  )

  const onPointerMove = useCallback(
    (event: React.PointerEvent) => {
      const drag = dragRef.current
      if (!drag) return
      const dy = event.clientY - drag.y
      setHeight(Math.max(snaps.peek, Math.min(snaps.full, drag.h - dy)))
    },
    [setHeight, snaps]
  )

  const onPointerUp = useCallback(() => {
    if (!dragRef.current) return
    dragRef.current = null
    setDragging(false)
    setDragged((current) => {
      const from = current?.of === containerHeight ? current.height : snaps.mid
      const nearest = [snaps.peek, snaps.mid, snaps.full].reduce((a, b) =>
        Math.abs(b - from) < Math.abs(a - from) ? b : a
      )
      return { height: nearest, of: containerHeight }
    })
  }, [containerHeight, snaps])

  return {
    height,
    dragging,
    gripHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    },
  }
}
