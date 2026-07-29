'use client'
import { useEffect, useRef } from 'react'

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
