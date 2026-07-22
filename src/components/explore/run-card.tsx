'use client'
import type { ExploreRun } from '@/lib/services/events'
import { isRunTimePast } from '@/lib/utils/run-time'
import { TypeTag, VibePill, MetaPill, Flag, Stamp, paceRange } from './badges'

const RulerIcon = (
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
    <path d="M3 8h18v8H3zM7 8v3M11 8v4M15 8v3M19 8v4" />
  </svg>
)
const GaugeIcon = (
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
    <path d="M5 18a8 8 0 1 1 14 0" />
    <path d="M12 14l4-3" />
    <circle cx="12" cy="18" r="1" />
  </svg>
)
const PinIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)
const ArrowIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)

type Props = {
  run: ExploreRun
  selected: boolean
  onSelect: () => void
  onOpen: () => void
  onIntent: () => void
  nowMin: number
  day: number
  tr: (k: string) => string
}

export function RunCard({
  run,
  selected,
  onSelect,
  onOpen,
  onIntent,
  nowMin,
  day,
  tr,
}: Props) {
  const cancelled = run.status === 'CANCELLED'
  const isPast = day === 0 && !cancelled && isRunTimePast(run.time, nowMin)
  const accent = cancelled ? 'var(--coral)' : 'var(--lime)'
  const dimmed = isPast && !selected

  const pace = paceRange(run.club.paceMin, run.club.paceMax)
  const typeLabel = run.club.type
    ? tr(`type_${run.club.type.toLowerCase()}`)
    : null
  const vibeLabel = run.club.vibe
    ? tr(`vibe_${run.club.vibe.toLowerCase()}`)
    : null

  return (
    <div
      className="tap sheet-card-enter qr-interactive-card qr-run-card"
      style={{
        borderRadius: 'var(--r-lg)',
        padding: '14px 15px',
        background: selected ? 'var(--surface-2)' : 'var(--surface)',
        border: `1px solid ${selected ? `color-mix(in oklch, ${accent} 55%, transparent)` : 'var(--line-2)'}`,
        boxShadow: selected
          ? `0 0 0 1px ${accent}, 0 10px 30px -12px rgba(0,0,0,.7)`
          : 'none',
        opacity: dimmed ? 0.75 : 1,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: selected ? 12 : 0,
        transition:
          'opacity .22s ease, box-shadow .18s ease, border-color .15s ease, background .15s ease, gap .24s cubic-bezier(.2,.7,.3,1)',
      }}
    >
      <button
        type="button"
        className="qr-card-action qr-card-summary"
        aria-expanded={selected}
        onClick={onSelect}
        onPointerEnter={onIntent}
        onFocus={onIntent}
        style={{
          width: '100%',
          padding: 0,
          border: 0,
          background: 'transparent',
          color: 'inherit',
          fontFamily: 'var(--font-ui)',
          textAlign: 'left',
          display: 'flex',
          flexDirection: 'column',
          gap: selected ? 12 : 9,
          cursor: 'pointer',
          transition: 'gap .24s cubic-bezier(.2,.7,.3,1)',
        }}
      >
        {/* top row */}
        <span
          style={{
            display: 'grid',
            gridTemplateColumns: '64px minmax(0, 1fr) auto',
            columnGap: 10,
            alignItems: 'start',
          }}
        >
          <span
            style={{
              display: 'block',
              fontFamily: 'var(--font-mono)',
              fontSize: 21,
              fontWeight: 700,
              lineHeight: 1,
              color: cancelled ? 'var(--faint)' : 'var(--text)',
              textDecoration: cancelled ? 'line-through' : 'none',
            }}
          >
            {run.time}
          </span>
          <span style={{ display: 'block', flex: 1, minWidth: 0 }}>
            <span
              style={{
                display: 'block',
                fontSize: 16.5,
                fontWeight: 700,
                color: cancelled ? 'var(--dim)' : 'var(--text)',
              }}
            >
              {run.title}
            </span>
            <span
              style={{
                fontSize: 13.5,
                color: 'var(--dim)',
                marginTop: 3,
                display: 'flex',
                gap: 7,
                alignItems: 'baseline',
                flexWrap: 'wrap',
                rowGap: 2,
              }}
            >
              <span
                style={{
                  color: 'var(--text)',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                {run.club.name}
              </span>
              {run.neighborhood && (
                <>
                  <span style={{ color: 'var(--faint)' }}>·</span>
                  <span style={{ color: 'var(--dim)', whiteSpace: 'nowrap' }}>
                    {run.neighborhood}
                  </span>
                </>
              )}
            </span>
          </span>
          {cancelled ? (
            <Stamp tone="cancelled">{tr('cancelled')}</Stamp>
          ) : isPast ? (
            <Stamp tone="past">{tr('past_badge')}</Stamp>
          ) : null}
        </span>

        {/* tags */}
        <span
          style={{
            display: 'flex',
            gap: 7,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          {typeLabel && <TypeTag kind={run.club.type} label={typeLabel} />}
          {run.club.beginnerFriendly && <Flag>{tr('beginner_badge')}</Flag>}
          {vibeLabel && <VibePill label={vibeLabel} />}
        </span>

        {/* meta */}
        {(run.distance || pace) && (
          <span
            style={{
              display: 'flex',
              gap: 14,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            {run.distance && (
              <MetaPill icon={RulerIcon}>{run.distance} km</MetaPill>
            )}
            {pace && (
              <MetaPill icon={GaugeIcon}>
                {pace} {tr('pace_unit')}
              </MetaPill>
            )}
          </span>
        )}
      </button>

      {/* expanded reveal */}
      <div
        className={`qr-run-reveal${selected ? ' is-open' : ''}`}
        aria-hidden={!selected}
      >
        <div className="qr-run-reveal-inner">
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 11,
              paddingTop: 12,
              borderTop: '1px solid var(--line)',
            }}
          >
            {run.address && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 9,
                  fontSize: 13.5,
                  color: 'var(--dim)',
                }}
              >
                <span
                  style={{
                    color: accent,
                    display: 'inline-flex',
                    marginTop: 1,
                  }}
                >
                  {PinIcon}
                </span>
                <span>{run.address}</span>
              </div>
            )}
            <div style={{ display: 'flex', gap: 9 }}>
              <button
                className="tap"
                tabIndex={selected ? 0 : -1}
                onClick={(e) => {
                  e.stopPropagation()
                  onOpen()
                }}
                style={{
                  flex: 1,
                  border: 'none',
                  borderRadius: 100,
                  padding: '11px 14px',
                  fontFamily: 'var(--font-ui)',
                  fontWeight: 700,
                  fontSize: 14,
                  background: 'var(--lime)',
                  color: 'var(--lime-ink)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 7,
                  cursor: 'pointer',
                }}
              >
                {tr('open_run')} {ArrowIcon}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
