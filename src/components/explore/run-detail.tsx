'use client'
import { useEffect, useState } from 'react'
import { TypeTag, VibePill, Flag, Stamp, paceRange } from './badges'

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
const ClockIcon = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
)
const RulerIcon = (
  <svg
    width="18"
    height="18"
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
    width="18"
    height="18"
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
    width="19"
    height="19"
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
const RouteIcon = (
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
    <circle cx="6" cy="19" r="2.4" />
    <circle cx="18" cy="5" r="2.4" />
    <path d="M8.4 19H14a3.5 3.5 0 0 0 0-7H10a3.5 3.5 0 0 1 0-7h5.6" />
  </svg>
)
const ChevRIcon = (
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
    <path d="M9 6l6 6-6 6" />
  </svg>
)

export type RunDetailData = {
  id: string
  title: string
  time: string
  status: 'SCHEDULED' | 'CANCELLED'
  distance: string | null
  address: string | null
  lat: number | null
  lng: number | null
  club: {
    id: string
    slug: string
    name: string
    type: string | null
    vibe: string | null
    beginnerFriendly: boolean
    paceMin: string | null
    paceMax: string | null
  }
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

function StatCol({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: string
  label: string
}) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 5,
        padding: '13px 4px',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <span style={{ color: 'var(--faint)' }}>{icon}</span>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 17,
          fontWeight: 700,
          color: 'var(--text)',
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontSize: 10.5,
          textTransform: 'uppercase',
          letterSpacing: '.04em',
          color: 'var(--faint)',
          fontWeight: 600,
        }}
      >
        {label}
      </span>
    </div>
  )
}

type Props = {
  run: RunDetailData
  onBack: () => void
  onOpenClub: (slug: string) => void
  tr: (k: string) => string
}

export function RunDetailPanel({ run, onBack, onOpenClub, tr }: Props) {
  const [shared, setShared] = useState(false)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const cancelled = run.status === 'CANCELLED'
  const accent = cancelled ? 'var(--coral)' : 'var(--lime)'
  const typeLabel = run.club.type ? tr(`type_${run.club.type}`) : null
  const vibeLabel = run.club.vibe ? tr(`vibe_${run.club.vibe}`) : null
  const pace = paceRange(run.club.paceMin, run.club.paceMax)

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {})
    setShared(true)
    setTimeout(() => setShared(false), 2000)
  }

  const dirUrl =
    run.lat && run.lng
      ? `https://www.google.com/maps/dir/?api=1&destination=${run.lat},${run.lng}`
      : null

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
          {ChevLIcon} {tr('back')}
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
          {shared ? CheckIcon : ShareIcon} {shared ? tr('copied') : tr('share')}
        </button>
      </div>

      {/* title block */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          {typeLabel && <TypeTag kind={run.club.type} label={typeLabel} />}
          {vibeLabel && <VibePill label={vibeLabel} />}
          {run.club.beginnerFriendly && <Flag>{tr('beginner_badge')}</Flag>}
          {cancelled && <Stamp tone="cancelled">{tr('cancelled')}</Stamp>}
        </div>
        <h1
          style={{
            fontSize: 27,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            margin: 0,
            textDecoration: cancelled ? 'line-through' : 'none',
            color: cancelled ? 'var(--dim)' : 'var(--text)',
          }}
        >
          {run.title}
        </h1>
        <div style={{ fontSize: 14.5, color: 'var(--dim)' }}>
          <span
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--text)' }}
          >
            {run.time}
          </span>
        </div>
      </div>

      {/* stat strip */}
      <div
        style={{
          display: 'flex',
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--r-lg)',
          overflow: 'hidden',
        }}
      >
        <StatCol icon={ClockIcon} value={run.time} label={tr('today')} />
        <div style={{ width: 1, background: 'var(--line)' }} />
        <StatCol
          icon={RulerIcon}
          value={run.distance ? `${run.distance} km` : '—'}
          label={tr('distance')}
        />
        <div style={{ width: 1, background: 'var(--line)' }} />
        <StatCol icon={GaugeIcon} value={pace ?? '—'} label={tr('pace')} />
      </div>

      {/* meeting point */}
      {run.address && (
        <div>
          <SectionLabel>{tr('meeting_point')}</SectionLabel>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--r-lg)',
              padding: '15px',
            }}
          >
            <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
              <span
                style={{ color: accent, display: 'inline-flex', marginTop: 1 }}
              >
                {PinIcon}
              </span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>
                  {run.address}
                </div>
                {run.lat && run.lng && (
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 11.5,
                      color: 'var(--faint)',
                      marginTop: 3,
                    }}
                  >
                    {run.lat.toFixed(4)}, {run.lng.toFixed(4)}
                  </div>
                )}
              </div>
            </div>
            {dirUrl && (
              <a
                href={dirUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="tap"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  border: 'none',
                  background: 'var(--surface-3)',
                  color: 'var(--text)',
                  borderRadius: 100,
                  padding: '11px 14px',
                  fontFamily: 'var(--font-ui)',
                  fontWeight: 700,
                  fontSize: 14,
                  textDecoration: 'none',
                }}
              >
                {RouteIcon} {tr('directions')}
              </a>
            )}
          </div>
        </div>
      )}

      {/* club */}
      <div>
        <SectionLabel>{tr('about_club')}</SectionLabel>
        <div
          className="tap"
          onClick={() => onOpenClub(run.club.slug)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 11,
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 'var(--r-lg)',
            padding: '15px',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div>
              <h3 style={{ fontSize: 16.5, margin: 0 }}>{run.club.name}</h3>
            </div>
            <span
              style={{
                color: 'var(--faint)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              {tr('view_club')} {ChevRIcon}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
