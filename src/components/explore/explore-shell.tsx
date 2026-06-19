'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { MapView, type MapPoint } from './map-view'
import { WeekBar, type WeekDay } from './week-bar'
import { useTheme } from './theme-provider'
import type { ExploreRun } from '@/lib/services/events'
import type { ExploreClub } from '@/lib/services/clubs'

const RAIL_WIDTH = 404

type Mode = 'runs' | 'clubs'

function buildWeekDays(
  counts: { day: number; count: number }[],
  locale: string,
  tr: (k: string) => string
): WeekDay[] {
  const loc = locale === 'fr' ? 'fr-CA' : 'en-CA'
  const wdFmt = new Intl.DateTimeFormat(loc, { weekday: 'short' })
  const mdFmt = new Intl.DateTimeFormat(loc, { day: 'numeric', month: 'short' })
  const countMap = Object.fromEntries(
    counts.map(({ day, count }) => [day, count])
  )

  return Array.from({ length: 7 }, (_, o) => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() + o)

    let short: string
    if (o === 0) short = tr('tonight')
    else if (o === 1) short = tr('tomorrow')
    else short = wdFmt.format(date).replace('.', '').toUpperCase()

    return {
      offset: o,
      short,
      dateLabel: mdFmt.format(date).replace('.', ''),
      count: countMap[o] ?? 0,
    }
  })
}

function todMin(): number {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

function toMin(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function ExploreShell() {
  const { theme, setTheme } = useTheme()
  const locale = useLocale()
  const t = useTranslations('explore')
  const tr = useCallback((k: string) => t(k as Parameters<typeof t>[0]), [t])

  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const [desktop, setDesktop] = useState(false)
  const [containerH, setContainerH] = useState(0)

  const [mode, setModeRaw] = useState<Mode>('runs')
  const [day, setDayRaw] = useState(0)
  const [selId, setSelId] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const [weekCounts, setWeekCounts] = useState<
    { day: number; count: number }[]
  >([])
  const [runs, setRuns] = useState<ExploreRun[]>([])
  const [clubs, setClubs] = useState<ExploreClub[]>([])
  const [loadingRuns, setLoadingRuns] = useState(false)

  const [dragging, setDragging] = useState(false)
  const dragRef = useRef<{ y: number; h: number } | null>(null)
  const snaps = useMemo(
    () => ({
      peek: Math.round(containerH * 0.34),
      mid: Math.round(containerH * 0.6),
      full: Math.round(containerH * 0.93),
    }),
    [containerH]
  )
  const [sheetH, setSheetH] = useState(0)
  useEffect(() => {
    if (snaps.mid > 0 && !dragging) setSheetH(snaps.mid)
  }, [snaps.mid, dragging])

  // breakpoint + height tracking
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setDesktop(el.clientWidth >= 880)
      setContainerH(el.clientHeight)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // fetch week counts once
  useEffect(() => {
    fetch('/api/explore/week-counts')
      .then((r) => r.json())
      .then(setWeekCounts)
      .catch(() => {})
  }, [])

  // fetch runs when day changes
  useEffect(() => {
    setLoadingRuns(true)
    fetch(`/api/explore/runs?day=${day}`)
      .then((r) => r.json())
      .then((data: ExploreRun[]) => {
        setRuns(data)
        setSelId(null)
      })
      .catch(() => {})
      .finally(() => setLoadingRuns(false))
  }, [day])

  // fetch clubs once (mode switch)
  useEffect(() => {
    if (mode !== 'clubs' || clubs.length > 0) return
    fetch('/api/explore/clubs')
      .then((r) => r.json())
      .then(setClubs)
      .catch(() => {})
  }, [mode, clubs.length])

  const week = useMemo(
    () => buildWeekDays(weekCounts, locale, tr),
    [weekCounts, locale, tr]
  )

  const setMode = useCallback((m: Mode) => {
    setModeRaw(m)
    setSelId(null)
    setQuery('')
  }, [])

  const setDay = useCallback((o: number) => {
    setDayRaw(o)
    setSelId(null)
  }, [])

  const nowMin = todMin()

  // map points
  const points = useMemo((): MapPoint[] => {
    if (mode === 'clubs') {
      return clubs
        .filter((c) => c.lat !== null && c.lng !== null)
        .map((c) => ({
          id: c.id,
          lat: c.lat!,
          lng: c.lng!,
          kind: 'club' as const,
          label: c.name,
        }))
    }
    return runs
      .filter((r) => r.lat !== null && r.lng !== null)
      .map((r) => ({
        id: r.id,
        lat: r.lat!,
        lng: r.lng!,
        kind: 'run' as const,
        label: r.time,
        cancelled: r.status === 'CANCELLED',
        past: day === 0 && r.status !== 'CANCELLED' && toMin(r.time) < nowMin,
      }))
  }, [mode, clubs, runs, day, nowMin])

  const insets = useMemo(
    () =>
      desktop
        ? { left: RAIL_WIDTH + 24, top: 24, bottom: 24 }
        : { left: 0, top: 76, bottom: sheetH },
    [desktop, sheetH]
  )

  // grip drag
  const onGripDown = useCallback(
    (e: React.PointerEvent) => {
      dragRef.current = { y: e.clientY, h: sheetH }
      setDragging(true)
      try {
        ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      } catch {}
    },
    [sheetH]
  )
  const onGripMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current) return
      const dy = e.clientY - dragRef.current.y
      setSheetH(() => {
        const h = dragRef.current!.h - dy
        return Math.max(snaps.peek, Math.min(snaps.full, h))
      })
    },
    [snaps]
  )
  const onGripUp = useCallback(() => {
    if (!dragRef.current) return
    dragRef.current = null
    setDragging(false)
    setSheetH((h) => {
      const arr = [snaps.peek, snaps.mid, snaps.full]
      return arr.reduce((a, b) => (Math.abs(b - h) < Math.abs(a - h) ? b : a))
    })
  }, [snaps])

  const q = query.trim().toLowerCase()
  const filteredRuns = useMemo(
    () =>
      runs.filter((r) =>
        q
          ? r.title.toLowerCase().includes(q) ||
            r.club.name.toLowerCase().includes(q)
          : true
      ),
    [runs, q]
  )
  const filteredClubs = useMemo(
    () => clubs.filter((c) => (q ? c.name.toLowerCase().includes(q) : true)),
    [clubs, q]
  )

  const runCount = filteredRuns.length
  const clubCount = filteredClubs.length

  return (
    <div
      ref={rootRef}
      className="qr-root"
      data-theme={theme}
      style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}
    >
      {/* Map */}
      <MapView
        points={points}
        activeId={selId}
        onSelect={setSelId}
        theme={theme}
        insets={insets}
      />

      {/* Top bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: desktop ? '18px 22px' : '16px 16px',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            pointerEvents: 'auto',
            background: 'color-mix(in oklch, var(--bg) 72%, transparent)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--line)',
            borderRadius: 100,
            padding: desktop ? '8px 14px' : '7px 12px',
            boxShadow: '0 2px 8px rgba(0,0,0,.18)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: 'var(--accent)',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--accent-ink)"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle
                cx="14"
                cy="5"
                r="1.8"
                fill="currentColor"
                stroke="none"
              />
              <path d="M6 21l3-5 3 1 1-4-4-2 1-3 4 2 2 3" />
            </svg>
          </div>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: '-0.02em',
            }}
          >
            quebec<span style={{ color: 'var(--accent)' }}>.run</span>
          </span>
        </div>

        <div style={{ pointerEvents: 'auto', display: 'flex', gap: 8 }}>
          {/* Theme toggle */}
          <div
            style={{
              display: 'flex',
              background: 'color-mix(in oklch, var(--bg) 72%, transparent)',
              backdropFilter: 'blur(12px)',
              border: '1px solid var(--line)',
              borderRadius: 100,
              padding: 3,
              gap: 2,
            }}
          >
            {(['dark', 'light'] as const).map((v) => (
              <button
                key={v}
                aria-label={v === 'dark' ? tr('theme_dark') : tr('theme_light')}
                onClick={() => setTheme(v)}
                style={{
                  border: 'none',
                  borderRadius: 100,
                  width: 30,
                  height: 26,
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                  background: theme === v ? 'var(--surface-3)' : 'transparent',
                  color: theme === v ? 'var(--accent)' : 'var(--faint)',
                }}
              >
                {v === 'dark' ? (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                ) : (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop rail */}
      {desktop && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: RAIL_WIDTH,
            zIndex: 35,
            display: 'flex',
            flexDirection: 'column',
            background: 'color-mix(in oklch, var(--bg) 88%, transparent)',
            backdropFilter: 'blur(16px)',
            borderRight: '1px solid var(--line)',
            boxShadow: '8px 0 40px rgba(0,0,0,.4)',
          }}
        >
          {/* spacer for top bar */}
          <div style={{ height: 94, flexShrink: 0 }} />

          {/* controls */}
          <div
            style={{
              padding: '4px 18px 14px',
              borderBottom: '1px solid var(--line)',
              flexShrink: 0,
            }}
          >
            <WeekBar week={week} selected={day} onSelect={setDay} />
            <div style={{ marginTop: 12 }}>
              <ModeToggle
                mode={mode}
                setMode={setMode}
                runCount={runCount}
                clubCount={clubCount}
                tr={tr}
              />
            </div>
          </div>

          {/* list */}
          <div
            ref={listRef}
            style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 26px' }}
          >
            <RunListSimple
              runs={filteredRuns}
              clubs={filteredClubs}
              mode={mode}
              selId={selId}
              onSelect={setSelId}
              loading={loadingRuns}
              tr={tr}
              day={day}
              week={week}
              setDay={setDay}
              nowMin={nowMin}
            />
          </div>
        </div>
      )}

      {/* Mobile bottom sheet */}
      {!desktop && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: sheetH,
            zIndex: 35,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg)',
            borderTop: '1px solid var(--line-2)',
            borderRadius: 'var(--r-xl) var(--r-xl) 0 0',
            boxShadow: '0 -12px 40px rgba(0,0,0,.5)',
            transition: dragging
              ? 'none'
              : 'height .34s cubic-bezier(.2,.7,.3,1)',
            overflow: 'hidden',
          }}
        >
          {/* grip */}
          <div
            onPointerDown={onGripDown}
            onPointerMove={onGripMove}
            onPointerUp={onGripUp}
            onPointerCancel={onGripUp}
            style={{
              flexShrink: 0,
              padding: '10px 16px 8px',
              cursor: 'grab',
              touchAction: 'none',
            }}
          >
            <div
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                background: 'var(--line-2)',
                margin: '0 auto',
              }}
            />
          </div>

          {/* controls */}
          <div style={{ flexShrink: 0, padding: '0 16px 12px' }}>
            <WeekBar week={week} selected={day} onSelect={setDay} />
            <div style={{ marginTop: 10 }}>
              <ModeToggle
                mode={mode}
                setMode={setMode}
                runCount={runCount}
                clubCount={clubCount}
                tr={tr}
              />
            </div>
          </div>

          {/* list */}
          <div
            ref={listRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '4px 16px calc(22px + env(safe-area-inset-bottom))',
            }}
          >
            <RunListSimple
              runs={filteredRuns}
              clubs={filteredClubs}
              mode={mode}
              selId={selId}
              onSelect={setSelId}
              loading={loadingRuns}
              tr={tr}
              day={day}
              week={week}
              setDay={setDay}
              nowMin={nowMin}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function ModeToggle({
  mode,
  setMode,
  runCount,
  clubCount,
  tr,
}: {
  mode: Mode
  setMode: (m: Mode) => void
  runCount: number
  clubCount: number
  tr: (k: string) => string
}) {
  const opt = (id: Mode, label: string, count: number) => {
    const on = mode === id
    return (
      <button
        key={id}
        onClick={() => setMode(id)}
        style={{
          flex: 1,
          border: 'none',
          borderRadius: 12,
          padding: '9px 12px',
          fontFamily: 'var(--font-ui)',
          fontWeight: 700,
          fontSize: 14,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 7,
          background: on ? 'var(--surface-3)' : 'transparent',
          color: on ? 'var(--text)' : 'var(--faint)',
          boxShadow: on
            ? '0 1px 0 rgba(255,255,255,.04) inset, 0 1px 3px rgba(0,0,0,.3)'
            : 'none',
        }}
      >
        {label}
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: on ? 'var(--accent-fg)' : 'var(--faint)',
          }}
        >
          {count}
        </span>
      </button>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        background: 'var(--bg-2)',
        border: '1px solid var(--line)',
        borderRadius: 14,
        padding: 4,
        gap: 3,
      }}
    >
      {opt('runs', tr('runs'), runCount)}
      {opt('clubs', tr('clubs'), clubCount)}
    </div>
  )
}

function RunListSimple({
  runs,
  clubs,
  mode,
  selId,
  onSelect,
  loading,
  tr,
  day,
  week,
  setDay,
  nowMin,
}: {
  runs: ExploreRun[]
  clubs: ExploreClub[]
  mode: Mode
  selId: string | null
  onSelect: (id: string) => void
  loading: boolean
  tr: (k: string) => string
  day: number
  week: WeekDay[]
  setDay: (o: number) => void
  nowMin: number
}) {
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="skel"
            style={{ height: 80, borderRadius: 'var(--r-lg)' }}
          />
        ))}
      </div>
    )
  }

  if (mode === 'clubs') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {clubs.map((c) => (
          <div
            key={c.id}
            style={{
              borderRadius: 'var(--r-lg)',
              padding: '14px 15px',
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-ui)',
                fontWeight: 700,
                fontSize: 15,
              }}
            >
              {c.name}
            </div>
            {c.description && (
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--dim)',
                  marginTop: 4,
                  lineHeight: 1.45,
                }}
              >
                {c.description}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  if (runs.length === 0) {
    const target =
      week.find((d, i) => i > 0 && d.offset !== day && d.count > 0) ?? null
    return (
      <div
        className="screen-enter"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 14,
          padding: '42px 24px 30px',
        }}
      >
        <h3 style={{ fontSize: 18 }}>{tr('no_runs_title')}</h3>
        <p
          style={{
            fontSize: 14,
            color: 'var(--dim)',
            maxWidth: 260,
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          {tr('no_runs_body')}
        </p>
        {target && (
          <button
            onClick={() => setDay(target.offset)}
            style={{
              marginTop: 4,
              border: 'none',
              background: 'var(--accent)',
              color: 'var(--accent-ink)',
              borderRadius: 100,
              padding: '12px 20px',
              fontFamily: 'var(--font-ui)',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            {tr('no_runs_cta')} {target.short.toLowerCase()} ·{' '}
            {target.dateLabel}
          </button>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div
        style={{ fontSize: 13, color: 'var(--faint)', padding: '0 2px 2px' }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            color: 'var(--text)',
            fontSize: 15,
          }}
        >
          {runs.length}
        </span>{' '}
        {runs.length === 1 ? tr('results_one') : tr('results_many')}
      </div>
      {runs.map((r) => {
        const isPast =
          day === 0 && r.status !== 'CANCELLED' && toMin(r.time) < nowMin
        const isSelected = r.id === selId
        const accent =
          r.status === 'CANCELLED' ? 'var(--coral)' : 'var(--accent)'
        return (
          <div
            key={r.id}
            onClick={() => onSelect(r.id)}
            className="sheet-card-enter"
            style={{
              borderRadius: 'var(--r-lg)',
              padding: '14px 15px',
              background: isSelected ? 'var(--surface-2)' : 'var(--surface)',
              border: `1px solid ${isSelected ? `color-mix(in oklch, ${accent} 55%, transparent)` : 'var(--line-2)'}`,
              boxShadow: isSelected
                ? `0 0 0 1px ${accent}, 0 10px 30px -12px rgba(0,0,0,.7)`
                : 'none',
              opacity: isPast && !isSelected ? 0.6 : 1,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              transition:
                'opacity .22s ease, box-shadow .18s ease, border-color .15s ease, background .15s ease',
            }}
          >
            <div style={{ display: 'flex', gap: 13, alignItems: 'flex-start' }}>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 21,
                  fontWeight: 700,
                  lineHeight: 1,
                  color:
                    r.status === 'CANCELLED' ? 'var(--faint)' : 'var(--text)',
                  textDecoration:
                    r.status === 'CANCELLED' ? 'line-through' : 'none',
                  minWidth: 52,
                }}
              >
                {r.time}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    fontFamily: 'var(--font-ui)',
                    color: 'var(--text)',
                  }}
                >
                  {r.title}
                </div>
                <div
                  style={{ fontSize: 13, color: 'var(--dim)', marginTop: 3 }}
                >
                  {r.club.name}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
