'use client'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { getPassport, type PassportData } from './passport-store'
import type { ExploreClub } from '@/lib/services/clubs'

const CheckIcon = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12l5 5L20 6" />
  </svg>
)

type Props = {
  onCollect: (club: ExploreClub) => void
}

export function PassportBook({ onCollect }: Props) {
  const t = useTranslations('explore')
  const [passport, setPassport] = useState<PassportData | null>(null)
  const [clubs, setClubs] = useState<ExploreClub[]>([])

  useEffect(() => {
    setPassport(getPassport())
    fetch('/api/explore/clubs')
      .then((r) => r.json())
      .then(setClubs)
      .catch(() => {})
  }, [])

  if (!passport) return null

  const stamped = Object.keys(passport.stamps)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2
          style={{ fontSize: 22, margin: '0 0 4px', letterSpacing: '-0.02em' }}
        >
          {t('passport_book_title')}
        </h2>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--dim)' }}>
          {stamped.length} / {clubs.length} {t('passport_book_count')}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {clubs.map((club) => {
          const done = stamped.includes(club.id)
          return (
            <div
              key={club.id}
              className="tap"
              onClick={() => !done && onCollect(club)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: done ? 'var(--lime-dim)' : 'var(--surface)',
                border: `1px solid ${done ? 'transparent' : 'var(--line)'}`,
                borderRadius: 'var(--r-md)',
                padding: '12px 14px',
                cursor: done ? 'default' : 'pointer',
                opacity: done ? 0.9 : 1,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600 }}>
                  {club.name}
                </div>
                {passport.stamps[club.id] && (
                  <div
                    style={{ fontSize: 12, color: 'var(--dim)', marginTop: 2 }}
                  >
                    {new Date(passport.stamps[club.id]).toLocaleDateString(
                      'fr-CA'
                    )}
                  </div>
                )}
              </div>
              {done ? (
                <span
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    background: 'var(--accent)',
                    color: 'var(--accent-ink)',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  {CheckIcon}
                </span>
              ) : (
                <span
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    border: '1.5px dashed var(--line-2)',
                    flexShrink: 0,
                  }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
