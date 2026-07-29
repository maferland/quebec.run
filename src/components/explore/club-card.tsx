'use client'
import { useTranslations } from 'next-intl'
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
type Props = {
  club: ExploreClub
  onOpen: () => void
  onIntent: () => void
}

export function ClubCard({ club, onOpen, onIntent }: Props) {
  const t = useTranslations('explore')
  const pace = paceRange(club.paceMin, club.paceMax)
  const typeLabel = club.type ? t(`type_${club.type.toLowerCase()}`) : null
  const vibeLabel = club.vibe ? t(`vibe_${club.vibe.toLowerCase()}`) : null

  return (
    <button
      type="button"
      className="tap sheet-card-enter qr-card-action"
      onClick={onOpen}
      onPointerEnter={onIntent}
      onFocus={onIntent}
      style={{
        width: '100%',
        borderRadius: 'var(--r-lg)',
        padding: '15px',
        background: 'var(--surface)',
        border: '1px solid var(--line-2)',
        color: 'var(--text)',
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
        {club.beginnerFriendly && <Flag>{t('beginner_badge')}</Flag>}
      </span>

      {pace && (
        <span style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <MetaPill icon={GaugeIcon}>
            {pace} {t('pace_unit')}
          </MetaPill>
        </span>
      )}
    </button>
  )
}
