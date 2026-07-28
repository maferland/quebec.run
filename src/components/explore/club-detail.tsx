'use client'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { TypeTag, VibePill, MetaPill, Flag, Stamp, paceRange } from './badges'
import { formatEventDate } from '@/lib/utils/intl'

const UPCOMING_PREVIEW_COUNT = 3
const SCHEDULE_PREVIEW_COUNT = 4

const ChevLIcon = (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 6l-6 6 6 6" />
  </svg>
)
const ChevRIcon = (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 6l6 6-6 6" />
  </svg>
)
const ShareIcon = (
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
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <path d="M8.6 10.6l6.8-4M8.6 13.4l6.8 4" />
  </svg>
)
const CheckIcon = (
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
    <path d="M5 12l5 5L20 6" />
  </svg>
)
const GaugeIcon = (
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
    <path d="M5 18a8 8 0 1 1 14 0" />
    <path d="M12 14l4-3" />
    <circle cx="12" cy="18" r="1" />
  </svg>
)
const InstagramIcon = (
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
    <rect x="4" y="4" width="16" height="16" rx="5" />
    <circle cx="12" cy="12" r="3.4" />
    <circle cx="17" cy="7" r="0.6" fill="currentColor" />
  </svg>
)
const WebIcon = (
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
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" />
  </svg>
)

export type ClubDetailData = {
  id: string
  slug: string
  name: string
  type: string | null
  vibe: string | null
  beginnerFriendly: boolean
  paceMin: string | null
  paceMax: string | null
  description: string | null
  instagram: string | null
  website: string | null
  schedule: Array<{ time: string; title: string; days: string }>
  upcomingRuns: Array<{
    id: string
    date: string
    time: string
    title: string
    status: 'SCHEDULED' | 'CANCELLED'
    distance: string | null
    type: string | null
  }>
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: '.06em',
        color: 'var(--faint)',
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  )
}

type Props = {
  club: ClubDetailData
  onBack: () => void
  onOpenRun: (id: string) => void
  animateIn?: boolean
}

export function ClubDetailPanel({
  club,
  onBack,
  onOpenRun,
  animateIn = true,
}: Props) {
  const t = useTranslations('explore')
  const locale = useLocale()
  const [shared, setShared] = useState(false)
  const [shown, setShown] = useState(!animateIn)
  const [showAllSchedule, setShowAllSchedule] = useState(false)
  const [showAllUpcoming, setShowAllUpcoming] = useState(false)

  useEffect(() => {
    if (!animateIn) return
    const id = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(id)
  }, [animateIn])

  const pace = paceRange(club.paceMin, club.paceMax)
  const typeLabel = club.type ? t(`type_${club.type.toLowerCase()}`) : null
  const vibeLabel = club.vibe ? t(`vibe_${club.vibe.toLowerCase()}`) : null
  const visibleSchedule = showAllSchedule
    ? club.schedule
    : club.schedule.slice(0, SCHEDULE_PREVIEW_COUNT)
  const hiddenScheduleCount = Math.max(
    0,
    club.schedule.length - SCHEDULE_PREVIEW_COUNT
  )
  const visibleUpcoming = showAllUpcoming
    ? club.upcomingRuns
    : club.upcomingRuns.slice(0, UPCOMING_PREVIEW_COUNT)
  const hiddenUpcomingCount = Math.max(
    0,
    club.upcomingRuns.length - UPCOMING_PREVIEW_COUNT
  )

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {})
    setShared(true)
    setTimeout(() => setShared(false), 2000)
  }

  return (
    <div
      className="detail-enter"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        opacity: shown ? 1 : 0,
        transform: shown ? 'none' : 'translateY(8px)',
        transition: 'opacity .3s ease, transform .3s cubic-bezier(.2,.7,.3,1)',
      }}
    >
      {/* header */}
      <div
        className="qr-detail-actions"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <button
          className="tap"
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            border: '1px solid var(--line)',
            background: 'var(--surface)',
            color: 'var(--text)',
            borderRadius: 100,
            padding: '9px 14px 9px 11px',
            fontFamily: 'var(--font-ui)',
            fontWeight: 600,
            fontSize: 13.5,
            cursor: 'pointer',
          }}
        >
          {ChevLIcon} {t('back')}
        </button>
        <button
          className="tap"
          onClick={handleShare}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            border: `1px solid ${shared ? 'transparent' : 'var(--line)'}`,
            background: shared ? 'var(--lime)' : 'var(--surface)',
            color: shared ? 'var(--lime-ink)' : 'var(--text)',
            borderRadius: 100,
            padding: '9px 14px',
            fontFamily: 'var(--font-ui)',
            fontWeight: 600,
            fontSize: 13.5,
            cursor: 'pointer',
          }}
        >
          {shared ? CheckIcon : ShareIcon} {shared ? t('copied') : t('share')}
        </button>
      </div>

      {/* title */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <h1
          style={{
            fontSize: 28,
            lineHeight: 1.08,
            letterSpacing: '-0.02em',
            margin: 0,
          }}
        >
          {club.name}
        </h1>
        {club.instagram && (
          <div
            style={{
              fontSize: 13,
              color: 'var(--faint)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            @{club.instagram.replace('@', '')}
          </div>
        )}
      </div>

      {/* badges */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {typeLabel && <TypeTag kind={club.type} label={typeLabel} />}
        {vibeLabel && <VibePill label={vibeLabel} />}
        {pace && (
          <MetaPill icon={GaugeIcon}>
            {pace} {t('pace_unit')}
          </MetaPill>
        )}
        {club.beginnerFriendly && <Flag>{t('beginner_badge')}</Flag>}
      </div>

      {/* description */}
      {club.description && (
        <div style={{ fontSize: 14.5, color: 'var(--dim)', lineHeight: 1.55 }}>
          {club.description}
        </div>
      )}

      {/* socials */}
      {(club.instagram || club.website) && (
        <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
          {club.instagram && (
            <a
              href={`https://instagram.com/${club.instagram.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="tap"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                border: '1px solid var(--line)',
                background: 'var(--surface)',
                color: 'var(--dim)',
                borderRadius: 100,
                padding: '9px 14px',
                fontSize: 13,
                textDecoration: 'none',
                fontFamily: 'var(--font-mono)',
              }}
            >
              <span style={{ color: 'var(--text)', display: 'inline-flex' }}>
                {InstagramIcon}
              </span>
              {club.instagram}
            </a>
          )}
          {club.website && (
            <a
              href={club.website}
              target="_blank"
              rel="noopener noreferrer"
              className="tap"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                border: '1px solid var(--line)',
                background: 'var(--surface)',
                color: 'var(--dim)',
                borderRadius: 100,
                padding: '9px 14px',
                fontSize: 13,
                textDecoration: 'none',
                fontFamily: 'var(--font-mono)',
              }}
            >
              <span style={{ color: 'var(--text)', display: 'inline-flex' }}>
                {WebIcon}
              </span>
              {t('website') ?? 'Site web'}
            </a>
          )}
        </div>
      )}

      {/* weekly schedule */}
      {club.schedule.length > 0 && (
        <div>
          <SectionLabel>{t('weekly')}</SectionLabel>
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--r-lg)',
              overflow: 'hidden',
            }}
          >
            {visibleSchedule.map((s, i) => (
              <div
                key={i}
                className={
                  showAllSchedule && i >= SCHEDULE_PREVIEW_COUNT
                    ? 'reveal-row'
                    : undefined
                }
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '13px 15px',
                  borderTop: i ? '1px solid var(--line)' : 'none',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 14,
                    fontWeight: 700,
                    color: 'var(--accent-fg)',
                    minWidth: 46,
                  }}
                >
                  {s.time}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600 }}>
                    {s.title}
                  </div>
                  <div
                    style={{
                      fontSize: 12.5,
                      color: 'var(--dim)',
                      marginTop: 1,
                    }}
                  >
                    {s.days}
                  </div>
                </div>
              </div>
            ))}
            {hiddenScheduleCount > 0 && (
              <button
                className="tap"
                onClick={() => setShowAllSchedule((value) => !value)}
                style={{
                  width: '100%',
                  border: 'none',
                  borderTop: '1px solid var(--line)',
                  background: 'transparent',
                  color: 'var(--accent-fg)',
                  padding: '12px 15px',
                  fontFamily: 'var(--font-ui)',
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {showAllSchedule
                  ? t('show_fewer')
                  : t('see_more_count', { count: hiddenScheduleCount })}
              </button>
            )}
          </div>
        </div>
      )}

      {/* upcoming runs */}
      {club.upcomingRuns.length > 0 && (
        <div>
          <SectionLabel>{t('upcoming')}</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {visibleUpcoming.map((e, i) => {
              const cancelled = e.status === 'CANCELLED'
              const dateLabel = formatEventDate(e.date, locale)
              return (
                <button
                  type="button"
                  key={e.id}
                  className={`tap ${
                    showAllUpcoming && i >= UPCOMING_PREVIEW_COUNT
                      ? 'reveal-row'
                      : ''
                  }`}
                  onClick={() => onOpenRun(e.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    background: 'var(--surface)',
                    border: '1px solid var(--line)',
                    borderRadius: 'var(--r-md)',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    color: 'inherit',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 14,
                      fontWeight: 700,
                      minWidth: 44,
                      color: cancelled ? 'var(--faint)' : 'var(--text)',
                      textDecoration: cancelled ? 'line-through' : 'none',
                    }}
                  >
                    {e.time}
                  </span>
                  <span style={{ display: 'block', flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        display: 'block',
                        fontSize: 14,
                        fontWeight: 600,
                        color: cancelled ? 'var(--dim)' : 'var(--text)',
                      }}
                    >
                      {e.title}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color: 'var(--faint)',
                        display: 'flex',
                        gap: 7,
                      }}
                    >
                      {dateLabel && <span>{dateLabel}</span>}
                      {dateLabel && (e.distance || e.type) && <span>·</span>}
                      {e.distance && <span>{e.distance} km</span>}
                      {e.distance && e.type && <span>·</span>}
                      {e.type && (
                        <span style={{ textTransform: 'capitalize' }}>
                          {t(`type_${e.type.toLowerCase()}`)}
                        </span>
                      )}
                    </span>
                  </span>
                  {cancelled ? (
                    <Stamp tone="cancelled">{t('cancelled')}</Stamp>
                  ) : (
                    <span style={{ color: 'var(--faint)' }}>{ChevRIcon}</span>
                  )}
                </button>
              )
            })}
            {hiddenUpcomingCount > 0 && (
              <button
                className="tap"
                onClick={() => setShowAllUpcoming((value) => !value)}
                style={{
                  border: '1px solid var(--line)',
                  background: 'transparent',
                  color: 'var(--accent-fg)',
                  borderRadius: 'var(--r-md)',
                  padding: '11px 14px',
                  fontFamily: 'var(--font-ui)',
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {showAllUpcoming
                  ? t('show_fewer')
                  : t('see_more_count', { count: hiddenUpcomingCount })}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
