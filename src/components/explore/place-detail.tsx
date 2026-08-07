'use client'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { Link } from '@/i18n/navigation'
import { MetaPill } from './badges'

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
const RulerIcon = (
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
    <path d="M3 8h18v8H3zM7 8v3M11 8v4M15 8v3M19 8v4" />
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

export type PlaceDetailSlot = {
  id: string
  title: string
  schedule: string | null
  distance: string | null
  pace: string | null
  pacePolicy: 'SHARED' | 'OPEN_PACE' | null
}

export type PlaceDetailData = {
  clubSlug: string
  clubName: string
  clubDescription: string | null
  heading: string
  schedule: string
  address: string | null
  neighborhood: string | null
  lat: number | null
  lng: number | null
  slots: PlaceDetailSlot[]
  upcoming: Array<{ slug: string; date: string; label: string }>
  otherPlaces: Array<{ slug: string; label: string }>
}

const backButtonStyle = {
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
  textDecoration: 'none',
} as const

const clubCardStyle = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: 11,
  background: 'var(--surface)',
  border: '1px solid var(--line)',
  borderRadius: 'var(--r-lg)',
  padding: '15px',
  cursor: 'pointer',
  color: 'inherit',
  fontFamily: 'inherit',
  textAlign: 'left',
  textDecoration: 'none',
} as const

const dateChipStyle = {
  display: 'inline-flex',
  border: '1px solid var(--line)',
  background: 'var(--surface)',
  color: 'var(--text)',
  borderRadius: 100,
  padding: '8px 13px',
  fontFamily: 'var(--font-ui)',
  fontSize: 13,
  fontWeight: 600,
  textDecoration: 'none',
} as const

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
  place: PlaceDetailData
  onBack?: () => void
  onOpenClub?: (slug: string) => void
  onOpenPlace?: (slug: string) => void
  animateIn?: boolean
}

export function PlaceDetailPanel({
  place,
  onBack,
  onOpenClub,
  onOpenPlace,
  animateIn = true,
}: Props) {
  const t = useTranslations('explore')
  const tPlace = useTranslations('events.place')
  const [shared, setShared] = useState(false)
  const [shown, setShown] = useState(!animateIn)

  useEffect(() => {
    if (!animateIn) return
    const id = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(id)
  }, [animateIn])

  const clubDescription =
    place.clubDescription && place.clubDescription.length > 120
      ? `${place.clubDescription.slice(0, 120)}…`
      : place.clubDescription

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {})
    setShared(true)
    setTimeout(() => setShared(false), 2000)
  }

  const dirUrl =
    place.lat && place.lng
      ? `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`
      : null

  const clubBody = (
    <span style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <span style={{ display: 'block' }}>
        <span style={{ display: 'block', fontSize: 16.5, fontWeight: 700 }}>
          {place.clubName}
        </span>
        {clubDescription && (
          <span
            style={{
              display: 'block',
              marginTop: 6,
              color: 'var(--dim)',
              fontSize: 13,
              lineHeight: 1.4,
              fontWeight: 500,
            }}
          >
            {clubDescription}
          </span>
        )}
      </span>
      <span
        style={{
          color: 'var(--faint)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 4,
          fontSize: 13,
          fontWeight: 600,
          whiteSpace: 'nowrap',
        }}
      >
        {t('view_club')} {ChevRIcon}
      </span>
    </span>
  )

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
        {onBack ? (
          <button className="tap" onClick={onBack} style={backButtonStyle}>
            {ChevLIcon} {t('back')}
          </button>
        ) : (
          <Link href="/clubs" className="tap" style={backButtonStyle}>
            {ChevLIcon} {t('back')}
          </Link>
        )}
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
            fontSize: 27,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            margin: 0,
          }}
        >
          {place.heading}
        </h1>
        <div style={{ fontSize: 14.5, color: 'var(--dim)' }}>
          {place.schedule}
        </div>
      </div>

      {/* slots */}
      {place.slots.length > 1 && (
        <div>
          <SectionLabel>{tPlace('schedule')}</SectionLabel>
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--r-lg)',
              overflow: 'hidden',
            }}
          >
            {place.slots.map((slot, i) => (
              <div
                key={slot.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  padding: '13px 15px',
                  borderTop: i ? '1px solid var(--line)' : 'none',
                }}
              >
                <div style={{ fontSize: 14.5, fontWeight: 600 }}>
                  {slot.schedule ?? slot.title}
                </div>
                {(slot.distance || slot.pace) && (
                  <div style={{ display: 'flex', gap: 10 }}>
                    {slot.distance && (
                      <MetaPill icon={RulerIcon}>{slot.distance} km</MetaPill>
                    )}
                    {slot.pace && (
                      <MetaPill icon={GaugeIcon}>{slot.pace}</MetaPill>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* meeting point */}
      {place.address && (
        <div>
          <SectionLabel>{t('meeting_point')}</SectionLabel>
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
                style={{
                  color: 'var(--lime)',
                  display: 'inline-flex',
                  marginTop: 1,
                }}
              >
                {PinIcon}
              </span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>
                  {place.address}
                </div>
                {place.neighborhood && (
                  <div
                    style={{
                      fontSize: 12.5,
                      color: 'var(--dim)',
                      marginTop: 2,
                    }}
                  >
                    {place.neighborhood}
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
                {RouteIcon} {t('directions')}
              </a>
            )}
          </div>
        </div>
      )}

      {/* upcoming */}
      {place.upcoming.length > 0 && (
        <div>
          <SectionLabel>{tPlace('upcoming')}</SectionLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {place.upcoming.map((occurrence) => (
              <Link
                key={`${occurrence.slug}-${occurrence.date}`}
                href={`/run/${place.clubSlug}-${occurrence.slug}--${occurrence.date}`}
                className="tap"
                style={dateChipStyle}
              >
                {occurrence.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* other places */}
      {place.otherPlaces.length > 0 && (
        <div>
          <SectionLabel>
            {tPlace('otherPlaces', { name: place.clubName })}
          </SectionLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {place.otherPlaces.map((other) =>
              onOpenPlace ? (
                <button
                  key={other.slug}
                  type="button"
                  className="tap"
                  onClick={() => onOpenPlace(other.slug)}
                  style={dateChipStyle}
                >
                  {other.label}
                </button>
              ) : (
                <Link
                  key={other.slug}
                  href={`/clubs/${place.clubSlug}/events/${other.slug}`}
                  className="tap"
                  style={dateChipStyle}
                >
                  {other.label}
                </Link>
              )
            )}
          </div>
        </div>
      )}

      {/* club */}
      <div>
        <SectionLabel>{t('about_club')}</SectionLabel>
        {onOpenClub ? (
          <button
            type="button"
            className="tap"
            onClick={() => onOpenClub(place.clubSlug)}
            style={clubCardStyle}
          >
            {clubBody}
          </button>
        ) : (
          <Link
            href={`/clubs/${place.clubSlug}`}
            className="tap"
            style={clubCardStyle}
          >
            {clubBody}
          </Link>
        )}
      </div>
    </div>
  )
}
