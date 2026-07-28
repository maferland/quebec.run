'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getTorontoMinutes } from '@/lib/utils/run-time'

const DESKTOP_MIN_WIDTH = 880

export function useContainerMetrics<T extends HTMLElement>() {
  const rootRef = useRef<T>(null)
  const [desktop, setDesktop] = useState(false)
  const [height, setHeight] = useState(0)

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      setDesktop(el.clientWidth >= DESKTOP_MIN_WIDTH)
      setHeight(el.clientHeight)
    })
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
  const [height, setHeight] = useState(0)
  const dragRef = useRef<{ y: number; h: number } | null>(null)

  const snaps = useMemo(
    () => ({
      peek: Math.round(containerHeight * 0.34),
      mid: Math.round(containerHeight * 0.6),
      full: Math.round(containerHeight * 0.93),
    }),
    [containerHeight]
  )

  // Not keyed on `dragging`: that fired right after onPointerUp picked a snap
  // point, resetting the sheet to the middle on every drag.
  useEffect(() => {
    if (snaps.mid > 0) setHeight(snaps.mid)
  }, [snaps.mid])

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
      if (!dragRef.current) return
      const dy = event.clientY - dragRef.current.y
      setHeight(() =>
        Math.max(snaps.peek, Math.min(snaps.full, dragRef.current!.h - dy))
      )
    },
    [snaps]
  )

  const onPointerUp = useCallback(() => {
    if (!dragRef.current) return
    dragRef.current = null
    setDragging(false)
    setHeight((current) =>
      [snaps.peek, snaps.mid, snaps.full].reduce((a, b) =>
        Math.abs(b - current) < Math.abs(a - current) ? b : a
      )
    )
  }, [snaps])

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

export function useExploreSearch() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!open) return
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus())
    return () => window.cancelAnimationFrame(frame)
  }, [open])

  const close = useCallback(() => {
    setOpen(false)
    setQuery('')
  }, [])

  return { inputRef, open, setOpen, query, setQuery, close }
}

// Scrolls once per day, so the list does not jump again as runs age out.
export function useAutoScrollToNextRun({
  listRef,
  enabled,
  day,
  desktop,
  targetId,
}: {
  listRef: React.RefObject<HTMLDivElement | null>
  enabled: boolean
  day: number
  desktop: boolean
  targetId: string | null
}) {
  const scrolledDayRef = useRef<number | null>(null)
  const scrolledListRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!enabled || !targetId) return
    const list = listRef.current
    if (!list) return
    if (scrolledDayRef.current === day && scrolledListRef.current === list)
      return

    const target = list.querySelector<HTMLElement>(
      `[data-run-id="${targetId}"]`
    )
    if (!target) return

    list.scrollTo({
      top:
        list.scrollTop +
        target.getBoundingClientRect().top -
        list.getBoundingClientRect().top -
        4,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
    })
    scrolledDayRef.current = day
    scrolledListRef.current = list
  }, [day, desktop, enabled, listRef, targetId])
}
