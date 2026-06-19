'use client'
import { useEffect, useState } from 'react'
import { getPassport } from './passport-store'
import { PassportAuth } from './passport-auth'
import { PassportBook } from './passport-book'
import { PassportCollect } from './passport-collect'
import type { ExploreClub } from '@/lib/services/clubs'

if (
  typeof process !== 'undefined' &&
  !process.env.NEXT_PUBLIC_PASSPORT_ENABLED
) {
  // Guard moved to parent — kept here as a safety belt
}

type Screen = 'auth' | 'book' | { collect: ExploreClub }

const PassportIcon = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <path d="M9 7h6M9 11h6M9 15h4" />
  </svg>
)

const CloseIcon = (
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
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
)

type Props = { tr: (k: string) => string }

export function PassportFAB({ tr }: Props) {
  const [open, setOpen] = useState(false)
  const [screen, setScreen] = useState<Screen>('auth')

  useEffect(() => {
    if (open) {
      const p = getPassport()
      setScreen(p.account ? 'book' : 'auth')
    }
  }, [open])

  return (
    <>
      {/* FAB button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={tr('passport_fab_label')}
        style={{
          position: 'fixed',
          bottom: 'calc(24px + env(safe-area-inset-bottom))',
          left: 24,
          width: 52,
          height: 52,
          borderRadius: 26,
          border: 'none',
          background: 'var(--surface-3)',
          color: 'var(--text)',
          boxShadow: '0 4px 20px rgba(0,0,0,.4)',
          display: 'grid',
          placeItems: 'center',
          cursor: 'pointer',
          zIndex: 45,
        }}
      >
        {open ? CloseIcon : PassportIcon}
      </button>

      {/* Sheet */}
      {open && (
        <div
          style={{
            position: 'fixed',
            left: 0,
            bottom: 0,
            right: 0,
            zIndex: 55,
            background: 'var(--bg)',
            borderTop: '1px solid var(--line-2)',
            borderRadius: 'var(--r-xl) var(--r-xl) 0 0',
            boxShadow: '0 -12px 40px rgba(0,0,0,.5)',
            padding: '24px 20px calc(32px + env(safe-area-inset-bottom))',
            maxHeight: '80vh',
            overflowY: 'auto',
          }}
        >
          {screen === 'auth' && (
            <PassportAuth onDone={() => setScreen('book')} tr={tr} />
          )}
          {screen === 'book' && (
            <PassportBook
              onCollect={(club) => setScreen({ collect: club })}
              tr={tr}
            />
          )}
          {typeof screen === 'object' && 'collect' in screen && (
            <PassportCollect
              club={screen.collect}
              onDone={() => setScreen('book')}
              tr={tr}
            />
          )}
        </div>
      )}
    </>
  )
}
