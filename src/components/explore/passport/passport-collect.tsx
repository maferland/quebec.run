'use client'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import { addStamp } from './passport-store'
import type { ExploreClub } from '@/lib/services/clubs'

const PIN_LENGTH = 4
const CORRECT_PIN = '6064' // matches dev server port — fun easter egg

type Props = {
  club: ExploreClub
  onDone: () => void
}

export function PassportCollect({ club, onDone }: Props) {
  const t = useTranslations('explore')
  const [digits, setDigits] = useState<string[]>([])
  const [shake, setShake] = useState(false)
  const [success, setSuccess] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    },
    []
  )

  function press(d: string) {
    if (digits.length >= PIN_LENGTH || success) return
    const next = [...digits, d]
    setDigits(next)
    if (next.length === PIN_LENGTH) {
      if (next.join('') === CORRECT_PIN) {
        setSuccess(true)
        addStamp(club.id)
        timeoutRef.current = setTimeout(onDone, 1800)
      } else {
        setShake(true)
        timeoutRef.current = setTimeout(() => {
          setDigits([])
          setShake(false)
        }, 600)
      }
    }
  }

  function del() {
    setDigits((d) => d.slice(0, -1))
  }

  const filled = digits.length

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        alignItems: 'center',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h2
          style={{ fontSize: 20, margin: '0 0 6px', letterSpacing: '-0.02em' }}
        >
          {club.name}
        </h2>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--dim)' }}>
          {success ? t('passport_collect_success') : t('passport_collect_hint')}
        </p>
      </div>

      {/* PIN dots */}
      <div
        style={{
          display: 'flex',
          gap: 14,
          transform: shake ? 'translateX(6px)' : 'none',
          transition: shake ? 'transform .07s ease' : 'none',
        }}
      >
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <div
            key={i}
            style={{
              width: 16,
              height: 16,
              borderRadius: 8,
              background: success
                ? 'var(--accent)'
                : i < filled
                  ? 'var(--text)'
                  : 'var(--line-2)',
              transition: 'background .15s',
            }}
          />
        ))}
      </div>

      {/* Keypad */}
      {!success && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10,
            width: '100%',
            maxWidth: 240,
          }}
        >
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map(
            (k, i) => {
              if (k === '') return <div key={i} />
              return (
                <button
                  key={k}
                  onClick={() => (k === '⌫' ? del() : press(k))}
                  style={{
                    border: 'none',
                    background: 'var(--surface)',
                    color: 'var(--text)',
                    borderRadius: 'var(--r-lg)',
                    height: 56,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 20,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {k}
                </button>
              )
            }
          )}
        </div>
      )}
    </div>
  )
}
