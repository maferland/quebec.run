'use client'
import { PACE_BUCKETS, todBucket } from './badges'

export type Filters = {
  types: string[]
  vibes: string[]
  pace: string
  beginner: boolean
  tod: string
}

export const DEFAULT_FILTERS: Filters = {
  types: [],
  vibes: [],
  pace: 'any',
  beginner: false,
  tod: 'all',
}

export function filterCount(f: Filters): number {
  return (
    f.types.length +
    f.vibes.length +
    (f.beginner ? 1 : 0) +
    (f.pace !== 'any' ? 1 : 0) +
    (f.tod !== 'all' ? 1 : 0)
  )
}

export function runMatches(
  run: {
    club: {
      type: string | null
      vibe: string | null
      beginnerFriendly: boolean
      paceMin: string | null
      paceMax: string | null
    }
    time: string
  },
  filters: Filters
): boolean {
  if (filters.types.length > 0 && !filters.types.includes(run.club.type ?? ''))
    return false
  if (filters.vibes.length > 0 && !filters.vibes.includes(run.club.vibe ?? ''))
    return false
  if (filters.beginner && !run.club.beginnerFriendly) return false
  if (filters.tod !== 'all' && todBucket(run.time) !== filters.tod) return false
  if (filters.pace !== 'any') {
    const bucket = PACE_BUCKETS.find((b) => b.id === filters.pace)
    if (bucket) {
      const min = parseFloat(run.club.paceMin ?? '0')
      const max = parseFloat(run.club.paceMax ?? '99')
      if (!(min < bucket.hi && max > bucket.lo)) return false
    }
  }
  return true
}

export function clubMatches(
  club: {
    type: string | null
    vibe: string | null
    beginnerFriendly: boolean
    paceMin: string | null
    paceMax: string | null
  },
  filters: Filters
): boolean {
  if (filters.types.length > 0 && !filters.types.includes(club.type ?? ''))
    return false
  if (filters.vibes.length > 0 && !filters.vibes.includes(club.vibe ?? ''))
    return false
  if (filters.beginner && !club.beginnerFriendly) return false
  if (filters.pace !== 'any') {
    const bucket = PACE_BUCKETS.find((b) => b.id === filters.pace)
    if (bucket) {
      const min = parseFloat(club.paceMin ?? '0')
      const max = parseFloat(club.paceMax ?? '99')
      if (!(min < bucket.hi && max > bucket.lo)) return false
    }
  }
  return true
}

function Toggle({
  on,
  onClick,
  children,
}: {
  on: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      className={`chip tap${on ? ' is-on' : ''}`}
      onClick={onClick}
      style={{
        border: 'none',
        fontFamily: 'var(--font-ui)',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

function SkelChip({ w }: { w: number }) {
  return (
    <span
      className="skel"
      style={{
        width: w,
        height: 32,
        borderRadius: 100,
        display: 'inline-block',
      }}
    />
  )
}

function SkelSection({ widths }: { widths: number[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
      <span
        className="skel"
        style={{ width: 84, height: 11, borderRadius: 4 }}
      />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {widths.map((w, i) => (
          <SkelChip key={i} w={w} />
        ))}
      </div>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '.06em',
          color: 'var(--faint)',
        }}
      >
        {title}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {children}
      </div>
    </div>
  )
}

const CheckIcon = (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12l5 5L20 6" />
  </svg>
)

type Props = {
  filters: Filters
  setFilters: (fn: (prev: Filters) => Filters) => void
  onClose: () => void
  resultCount: number
  showTod: boolean
  loading: boolean
  locale: string
  tr: (k: string) => string
}

export function FilterPanel({
  filters,
  setFilters,
  onClose,
  resultCount,
  showTod,
  loading,
  locale,
  tr,
}: Props) {
  const toggle = (key: 'types' | 'vibes', val: string) => {
    setFilters((f) => {
      const has = f[key].includes(val)
      return {
        ...f,
        [key]: has ? f[key].filter((x) => x !== val) : [...f[key], val],
      }
    })
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <SkelSection widths={[64, 58, 86, 60]} />
        <SkelSection widths={[70, 96, 104]} />
        <SkelSection widths={[60, 92, 110, 78]} />
        <SkelSection widths={[120]} />
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <span
            className="skel"
            style={{ width: 90, height: 44, borderRadius: 100 }}
          />
          <span
            className="skel"
            style={{ flex: 1, height: 44, borderRadius: 100 }}
          />
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {showTod && (
        <Section title={tr('filter_time')}>
          {(['all', 'am', 'pm', 'eve'] as const).map((k) => (
            <Toggle
              key={k}
              on={filters.tod === k}
              onClick={() => setFilters((f) => ({ ...f, tod: k }))}
            >
              {tr(k === 'all' ? 'tod_all' : `tod_${k}`)}
            </Toggle>
          ))}
        </Section>
      )}

      <Section title={tr('filter_type')}>
        {(['trail', 'road', 'track', 'mixed'] as const).map((k) => (
          <Toggle
            key={k}
            on={filters.types.includes(k)}
            onClick={() => toggle('types', k)}
          >
            {tr(`type_${k}`)}
          </Toggle>
        ))}
      </Section>

      <Section title={tr('filter_vibe')}>
        {(['social', 'training', 'competitive'] as const).map((k) => (
          <Toggle
            key={k}
            on={filters.vibes.includes(k)}
            onClick={() => toggle('vibes', k)}
          >
            {tr(`vibe_${k}`)}
          </Toggle>
        ))}
      </Section>

      <Section title={tr('filter_pace')}>
        {PACE_BUCKETS.map((b) => (
          <Toggle
            key={b.id}
            on={filters.pace === b.id}
            onClick={() => setFilters((f) => ({ ...f, pace: b.id }))}
          >
            {b.id === 'any' ? (
              tr('pace_any')
            ) : (
              <span
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
              >
                {locale === 'fr'
                  ? (b as { labelFr?: string }).labelFr
                  : (b as { labelEn?: string }).labelEn}
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    opacity: 0.6,
                    fontSize: 11,
                  }}
                >
                  {(b as { sub?: string }).sub}
                </span>
              </span>
            )}
          </Toggle>
        ))}
      </Section>

      <Section title={tr('filter_beginner')}>
        <Toggle
          on={filters.beginner}
          onClick={() => setFilters((f) => ({ ...f, beginner: !f.beginner }))}
        >
          <span
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}
          >
            <span
              style={{
                opacity: filters.beginner ? 1 : 0.3,
                display: 'inline-flex',
              }}
            >
              {CheckIcon}
            </span>
            {tr('beginner_badge')}
          </span>
        </Toggle>
      </Section>

      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <button
          className="tap"
          onClick={() =>
            setFilters(() => ({
              types: [],
              vibes: [],
              pace: 'any',
              beginner: false,
              tod: 'all',
            }))
          }
          style={{
            flex: '0 0 auto',
            border: '1px solid var(--line-2)',
            background: 'transparent',
            color: 'var(--dim)',
            borderRadius: 100,
            padding: '12px 18px',
            fontFamily: 'var(--font-ui)',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          {tr('clear')}
        </button>
        <button
          className="tap"
          onClick={onClose}
          style={{
            flex: 1,
            border: 'none',
            background: 'var(--lime)',
            color: 'var(--lime-ink)',
            borderRadius: 100,
            padding: '12px 18px',
            fontFamily: 'var(--font-ui)',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          {tr('apply')} · {resultCount}
        </button>
      </div>
    </div>
  )
}
