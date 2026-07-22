'use client'
import { useCallback, useEffect, useRef, useState } from 'react'

export type WeekDay = {
  offset: number
  short: string
  dateLabel: string
  count: number
}

type Props = {
  week: WeekDay[]
  selected: number
  onSelect: (offset: number) => void
}

export function WeekBar({ week, selected, onSelect }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; left: number } | null>(null)
  const moved = useRef(0)
  const [edges, setEdges] = useState({ start: true, end: false })

  const updateEdges = useCallback(() => {
    const el = ref.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    setEdges({
      start: el.scrollLeft <= 1,
      end: max <= 1 || el.scrollLeft >= max - 1,
    })
  }, [])

  useEffect(() => {
    updateEdges()
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(updateEdges)
    ro.observe(el)
    return () => ro.disconnect()
  }, [updateEdges, week])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth) return
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return
      e.preventDefault()
      const isMouse = e.deltaMode !== 0 || Math.abs(e.deltaY) >= 50
      if (isMouse)
        el.scrollBy({
          left: e.deltaY * (e.deltaMode === 0 ? 1.1 : 16),
          behavior: 'smooth',
        })
      else el.scrollLeft += e.deltaY
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const lf = edges.start ? '0px' : '16px'
  const rf = edges.end ? '0px' : '30px'
  const mask = `linear-gradient(to right, transparent 0, #000 ${lf}, #000 calc(100% - ${rf}), transparent 100%)`

  return (
    <div
      ref={ref}
      onScroll={updateEdges}
      onPointerDown={(e) => {
        if (e.pointerType === 'touch') return
        drag.current = { x: e.clientX, left: ref.current!.scrollLeft }
        moved.current = 0
      }}
      onPointerMove={(e) => {
        if (!drag.current) return
        const dx = e.clientX - drag.current.x
        moved.current = Math.max(moved.current, Math.abs(dx))
        ref.current!.scrollLeft = drag.current.left - dx
      }}
      onPointerUp={() => {
        drag.current = null
      }}
      onPointerLeave={() => {
        drag.current = null
      }}
      onPointerCancel={() => {
        drag.current = null
      }}
      style={{
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        padding: '2px 2px 4px',
        touchAction: 'pan-x',
        cursor: 'grab',
        WebkitMaskImage: mask,
        maskImage: mask,
        scrollbarWidth: 'none',
      }}
    >
      {week.map((d) => {
        const on = d.offset === selected
        const hasRuns = d.count > 0
        return (
          <button
            key={d.offset}
            onClick={() => {
              if (moved.current > 6) {
                moved.current = 0
                return
              }
              onSelect(d.offset)
            }}
            style={{
              flex: '0 0 auto',
              minWidth: 62,
              border: `1px solid ${on ? 'transparent' : 'var(--line)'}`,
              background: on ? 'var(--accent)' : 'var(--surface)',
              color: on ? 'var(--accent-ink)' : 'var(--text)',
              borderRadius: 16,
              padding: '9px 6px 8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              fontFamily: 'var(--font-ui)',
              cursor: 'pointer',
              transform: on ? 'translateY(-1px)' : 'none',
              transition:
                'background .2s ease, border-color .2s ease, color .2s ease, transform .18s cubic-bezier(.2,.7,.3,1)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: '.03em',
                textTransform: 'uppercase',
                opacity: on ? 0.7 : 0.62,
              }}
            >
              {d.short}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22,
                fontWeight: 700,
                lineHeight: 1.05,
                color: on
                  ? 'var(--accent-ink)'
                  : hasRuns
                    ? 'var(--text)'
                    : 'var(--faint)',
              }}
            >
              {hasRuns ? d.count : '—'}
            </span>
            <span
              style={{
                fontSize: 9.5,
                fontWeight: 600,
                opacity: on ? 0.75 : 0.5,
                color: on ? 'var(--accent-ink)' : 'var(--dim)',
              }}
            >
              {d.dateLabel}
            </span>
          </button>
        )
      })}
    </div>
  )
}
