import { useTranslations } from 'next-intl'
import { ClubCard } from './club-card'
import { RunCard } from './run-card'
import { EmptyDay, NoMatch } from './quiet-states'
import type { WeekDay } from './week-bar'
import type { ExploreRun } from '@/lib/services/events'
import type { ExploreClub } from '@/lib/services/clubs'

type Mode = 'runs' | 'clubs'

// ── Sub-components ────────────────────────────────────────────────────────────

const FilterIcon = (
  <svg
    width="19"
    height="19"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 5h18M6 12h12M10 19h4" />
  </svg>
)

export function FilterButton({
  n,
  onClick,
}: {
  n: number
  onClick: () => void
}) {
  const t = useTranslations('explore')
  const on = n > 0
  return (
    <button
      aria-label={t('filters')}
      onClick={onClick}
      style={{
        width: 44,
        height: 44,
        flexShrink: 0,
        display: 'grid',
        placeItems: 'center',
        cursor: 'pointer',
        border: `1px solid ${on ? 'transparent' : 'var(--line)'}`,
        background: on ? 'var(--lime-dim)' : 'var(--surface)',
        color: on ? 'var(--accent-fg)' : 'var(--text)',
        borderRadius: 14,
        position: 'relative',
      }}
    >
      {FilterIcon}
      {on && (
        <span
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            width: 8,
            height: 8,
            borderRadius: 4,
            background: 'var(--accent)',
          }}
        />
      )}
    </button>
  )
}

export function ModeToggle({
  mode,
  setMode,
  runCount,
  clubCount,
}: {
  mode: Mode
  setMode: (m: Mode) => void
  runCount: number
  clubCount: number
}) {
  const t = useTranslations('explore')
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
        flex: 1,
        display: 'flex',
        background: 'var(--bg-2)',
        border: '1px solid var(--line)',
        borderRadius: 14,
        padding: 4,
        gap: 3,
      }}
    >
      {opt('runs', t('runs'), runCount)}
      {opt('clubs', t('clubs'), clubCount)}
    </div>
  )
}

export function RunList({
  runs,
  clubs,
  mode,
  selId,
  onSelect,
  onOpenRun,
  onOpenClub,
  loading,
  refreshing,
  day,
  week,
  setDay,
  nowMin,
  hasActiveFilters,
  hasSearchQuery,
  onClearFilters,
  allRuns,
  onPreloadRun,
  onPreloadClub,
}: {
  runs: ExploreRun[]
  clubs: ExploreClub[]
  mode: Mode
  selId: string | null
  onSelect: (id: string | null) => void
  onOpenRun: (id: string) => void
  onOpenClub: (id: string) => void
  loading: boolean
  refreshing: boolean
  day: number
  week: WeekDay[]
  setDay: (o: number) => void
  nowMin: number
  hasActiveFilters: boolean
  hasSearchQuery: boolean
  onClearFilters: () => void
  allRuns: ExploreRun[]
  onPreloadRun: (id: string) => void
  onPreloadClub: (slug: string) => void
}) {
  const t = useTranslations('explore')
  const resultCount = mode === 'clubs' ? clubs.length : runs.length
  const resultLabel =
    mode === 'clubs'
      ? t(resultCount === 1 ? 'clubs_count_one' : 'clubs_count_many')
      : t(resultCount === 1 ? 'results_one' : 'results_many')
  const resultSummary = (
    <div style={{ fontSize: 13, color: 'var(--faint)', padding: '0 2px 2px' }}>
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          color: 'var(--text)',
          fontSize: 15,
        }}
      >
        {resultCount}
      </span>{' '}
      {resultLabel}
    </div>
  )

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
    if (clubs.length === 0) {
      return hasActiveFilters ? (
        <NoMatch onClearFilters={onClearFilters} />
      ) : (
        <NoMatch variant="search" />
      )
    }
    return (
      <div
        className={refreshing ? 'is-refreshing' : undefined}
        style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
      >
        {resultSummary}
        {clubs.map((c) => (
          <ClubCard
            key={c.id}
            club={c}
            onOpen={() => onOpenClub(c.id)}
            onIntent={() => onPreloadClub(c.slug)}
          />
        ))}
      </div>
    )
  }

  // No runs on this day at all (no filters applied)
  if (allRuns.length === 0) {
    return <EmptyDay week={week} day={day} setDay={setDay} />
  }

  // Filters excluded all runs
  if (runs.length === 0) {
    return hasActiveFilters ? (
      <NoMatch onClearFilters={onClearFilters} />
    ) : hasSearchQuery ? (
      <NoMatch variant="search" />
    ) : (
      <EmptyDay week={week} day={day} setDay={setDay} />
    )
  }

  return (
    <div
      className={refreshing ? 'is-refreshing' : undefined}
      style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
    >
      {resultSummary}
      {runs.map((r) => (
        <RunCard
          key={r.id}
          run={r}
          selected={r.id === selId}
          onSelect={() => onSelect(r.id === selId ? null : r.id)}
          onOpen={() => onOpenRun(r.id)}
          onIntent={() => onPreloadRun(r.id)}
          nowMin={nowMin}
          day={day}
        />
      ))}
    </div>
  )
}
