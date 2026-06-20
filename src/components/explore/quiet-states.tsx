'use client'
import { useEffect, useState } from 'react'
import type { WeekDay } from './week-bar'

function useMounted() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])
  return mounted
}

function FadeIn({ children }: { children: React.ReactNode }) {
  const mounted = useMounted()
  const motionOk = mounted
    ? !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : true
  return (
    <div
      style={{
        opacity: motionOk ? (mounted ? 1 : 0) : 1,
        transform: motionOk ? (mounted ? 'none' : 'translateY(12px)') : 'none',
        transition:
          'opacity .35s ease, transform .35s cubic-bezier(.2,.7,.3,1)',
      }}
    >
      {children}
    </div>
  )
}

const CalendarIcon = (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M3 9h18M8 2v4M16 2v4" />
  </svg>
)

const SearchIcon = (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.35-4.35" />
  </svg>
)

const CheckCircleIcon = (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12l3 3 5-5" />
  </svg>
)

type EmptyDayProps = {
  week: WeekDay[]
  day: number
  setDay: (offset: number) => void
  tr: (k: string) => string
}

export function EmptyDay({ week, day, setDay, tr }: EmptyDayProps) {
  const target =
    week.find((d, i) => i > 0 && d.offset !== day && d.count > 0) ?? null

  return (
    <FadeIn>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 14,
          padding: '42px 24px 30px',
        }}
      >
        <span style={{ color: 'var(--faint)' }}>{CalendarIcon}</span>
        <h3 style={{ fontSize: 18, margin: 0 }}>{tr('no_runs_title')}</h3>
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
    </FadeIn>
  )
}

type NoMatchProps = {
  onClearFilters: () => void
  tr: (k: string) => string
}

export function NoMatch({ onClearFilters, tr }: NoMatchProps) {
  return (
    <FadeIn>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 14,
          padding: '42px 24px 30px',
        }}
      >
        <span style={{ color: 'var(--faint)' }}>{SearchIcon}</span>
        <h3 style={{ fontSize: 18, margin: 0 }}>{tr('no_match_title')}</h3>
        <p
          style={{
            fontSize: 14,
            color: 'var(--dim)',
            maxWidth: 260,
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          {tr('no_match_body')}
        </p>
        <button
          onClick={onClearFilters}
          style={{
            marginTop: 4,
            border: '1px solid var(--line)',
            background: 'var(--surface)',
            color: 'var(--text)',
            borderRadius: 100,
            padding: '11px 20px',
            fontFamily: 'var(--font-ui)',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          {tr('clear_filters')}
        </button>
      </div>
    </FadeIn>
  )
}

type AllDoneNoteProps = {
  week: WeekDay[]
  setDay: (offset: number) => void
  tr: (k: string) => string
}

export function AllDoneNote({ week, setDay, tr }: AllDoneNoteProps) {
  const tomorrow = week.find((d) => d.offset === 1) ?? null

  return (
    <FadeIn>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 14,
          padding: '42px 24px 30px',
        }}
      >
        <span style={{ color: 'var(--accent)' }}>{CheckCircleIcon}</span>
        <h3 style={{ fontSize: 18, margin: 0 }}>{tr('all_done_title')}</h3>
        <p
          style={{
            fontSize: 14,
            color: 'var(--dim)',
            maxWidth: 260,
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          {tr('all_done_body')}
        </p>
        {tomorrow && tomorrow.count > 0 && (
          <button
            onClick={() => setDay(1)}
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
            {tr('all_done_cta')} {tomorrow.short.toLowerCase()} ·{' '}
            {tomorrow.dateLabel}
          </button>
        )}
      </div>
    </FadeIn>
  )
}
