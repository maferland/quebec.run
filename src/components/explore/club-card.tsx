'use client'
import type { ExploreClub } from '@/lib/services/clubs'
import { TypeTag, VibePill, MetaPill, Flag, paceRange } from './badges'

const UsersIcon = (
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
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
    <path d="M16 6.2a3.2 3.2 0 0 1 0 5.6M16.5 19a5.5 5.5 0 0 0-2-4.3" />
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

type Props = {
  club: ExploreClub
  onOpen: () => void
  tr: (k: string) => string
}

export function ClubCard({ club, onOpen, tr }: Props) {
  const pace = paceRange(club.paceMin, club.paceMax)
  const typeLabel = club.type ? tr(`type_${club.type.toLowerCase()}`) : null
  const vibeLabel = club.vibe ? tr(`vibe_${club.vibe.toLowerCase()}`) : null

  return (
    <div
      className="tap sheet-card-enter"
      onClick={onOpen}
      style={{
        borderRadius: 'var(--r-lg)',
        padding: '15px',
        background: 'var(--surface)',
        border: '1px solid var(--line-2)',
        display: 'flex',
        flexDirection: 'column',
        gap: 11,
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 10,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h3 style={{ fontSize: 17, margin: 0 }}>{club.name}</h3>
        </div>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: 'var(--faint)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            whiteSpace: 'nowrap',
          }}
        >
          {UsersIcon} {club.memberCount}
        </span>
      </div>

      {club.description && (
        <div
          style={{
            fontSize: 13.5,
            color: 'var(--dim)',
            lineHeight: 1.5,
          }}
        >
          {club.description.length > 100
            ? club.description.slice(0, 100) + '…'
            : club.description}
        </div>
      )}

      <div
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
      </div>

      {pace && (
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <MetaPill icon={GaugeIcon}>
            {pace} {tr('pace_unit')}
          </MetaPill>
        </div>
      )}
    </div>
  )
}
