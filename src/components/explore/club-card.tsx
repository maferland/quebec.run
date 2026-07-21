'use client'
import type { ExploreClub } from '@/lib/services/clubs'
import { TypeTag, VibePill, MetaPill, Flag, paceRange } from './badges'

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
  club: ExploreClub
  selected: boolean
  onSelect: () => void
  onOpen: () => void
  onIntent: () => void
  tr: (k: string) => string
}

export function ClubCard({
  club,
  selected,
  onSelect,
  onOpen,
  onIntent,
  tr,
}: Props) {
  const pace = paceRange(club.paceMin, club.paceMax)
  const typeLabel = club.type ? tr(`type_${club.type.toLowerCase()}`) : null
  const vibeLabel = club.vibe ? tr(`vibe_${club.vibe.toLowerCase()}`) : null

  return (
    <div
      className="tap sheet-card-enter qr-interactive-card"
      style={{
        borderRadius: 'var(--r-lg)',
        padding: '15px',
        background: selected ? 'var(--surface-2)' : 'var(--surface)',
        border: `1px solid ${selected ? 'color-mix(in oklch, var(--accent) 55%, transparent)' : 'var(--line-2)'}`,
        boxShadow: selected
          ? '0 0 0 1px var(--accent), 0 10px 30px -12px rgba(0,0,0,.7)'
          : 'none',
        color: 'var(--text)',
        display: 'flex',
        flexDirection: 'column',
        gap: selected ? 12 : 0,
        transition:
          'box-shadow .18s ease, border-color .15s ease, background .15s ease',
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
          gap: 11,
          cursor: 'pointer',
        }}
      >
        <span
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 10,
          }}
        >
          <span style={{ minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 17, fontWeight: 700 }}>
              {club.name}
            </span>
          </span>
        </span>

        {club.description && (
          <span
            style={{
              display: 'block',
              fontSize: 13.5,
              color: 'var(--dim)',
              lineHeight: 1.5,
            }}
          >
            {club.description.length > 100
              ? club.description.slice(0, 100) + '…'
              : club.description}
          </span>
        )}

        <span
          style={{
            display: 'flex',
            gap: 7,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          {typeLabel && <TypeTag kind={club.type} label={typeLabel} />}
          {vibeLabel && <VibePill label={vibeLabel} />}
          {club.beginnerFriendly && <Flag>{tr('beginner_badge')}</Flag>}
        </span>

        {pace && (
          <span style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <MetaPill icon={GaugeIcon}>
              {pace} {tr('pace_unit')}
            </MetaPill>
          </span>
        )}
      </button>

      {selected && (
        <div
          style={{
            paddingTop: 12,
            borderTop: '1px solid var(--line)',
          }}
        >
          <button
            type="button"
            className="tap"
            onClick={onOpen}
            style={{
              width: '100%',
              border: 'none',
              borderRadius: 100,
              padding: '11px 14px',
              fontFamily: 'var(--font-ui)',
              fontWeight: 700,
              fontSize: 14,
              background: 'var(--accent)',
              color: 'var(--accent-ink)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              cursor: 'pointer',
            }}
          >
            {tr('view_club')} {ArrowIcon}
          </button>
        </div>
      )}
    </div>
  )
}
