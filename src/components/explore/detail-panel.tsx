'use client'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type AnimationEvent,
} from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useTheme } from './theme-provider'
import { RunDetailPanel, type RunDetailData } from './run-detail'
import { ClubDetailPanel, type ClubDetailData } from './club-detail'
import type { ClubForDetail } from '@/lib/services/clubs'

const RAIL_WIDTH = 404
export const PANEL_EXIT_MS = 180

function useAnimatedClose(close: () => void) {
  const [exiting, setExiting] = useState(false)
  const closeRef = useRef(close)
  const fallbackRef = useRef<number | null>(null)

  useEffect(() => {
    closeRef.current = close
  }, [close])

  useEffect(() => {
    return () => {
      if (fallbackRef.current) window.clearTimeout(fallbackRef.current)
    }
  }, [])

  const requestClose = useCallback(() => {
    setExiting((alreadyExiting) => {
      if (alreadyExiting) return true
      fallbackRef.current = window.setTimeout(() => {
        fallbackRef.current = null
        closeRef.current()
      }, PANEL_EXIT_MS + 80)
      return true
    })
  }, [])

  const handleAnimationEnd = useCallback(
    (event: AnimationEvent<HTMLDivElement>) => {
      if (!exiting) return
      if (event.target !== event.currentTarget) return
      if (event.animationName !== 'detailPanelOut') return
      if (fallbackRef.current) {
        window.clearTimeout(fallbackRef.current)
        fallbackRef.current = null
      }
      closeRef.current()
    },
    [exiting]
  )

  return { exiting, requestClose, handleAnimationEnd }
}

// ── Shared overlay shell ──────────────────────────────────────────────────────

function OverlayShell({
  children,
  enter = true,
  exiting = false,
  onExitComplete,
}: {
  children: React.ReactNode
  enter?: boolean
  exiting?: boolean
  onExitComplete?: (event: AnimationEvent<HTMLDivElement>) => void
}) {
  const { theme } = useTheme()
  const [desktop, setDesktop] = useState(false)
  const className = `qr-root qr-panel-scroll qr-detail-shell${enter ? '' : ' is-static'}${exiting ? ' is-exiting' : ''}`

  useEffect(() => {
    const check = () => setDesktop(window.innerWidth >= 880)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  if (desktop) {
    return (
      <div
        className={className}
        onAnimationEnd={onExitComplete}
        data-theme={theme}
        suppressHydrationWarning
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: RAIL_WIDTH,
          zIndex: 1300,
          overflowY: 'auto',
          padding: '94px 18px 26px',
          background: 'var(--bg)',
          borderRight: '1px solid var(--line)',
          boxShadow: '8px 0 40px rgba(0,0,0,.4)',
          pointerEvents: 'auto',
          willChange: 'transform',
        }}
      >
        {children}
      </div>
    )
  }

  return (
    <div
      className={className}
      onAnimationEnd={onExitComplete}
      data-theme={theme}
      suppressHydrationWarning
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        top: '10%',
        zIndex: 1300,
        overflowY: 'auto',
        padding: '20px 16px calc(22px + env(safe-area-inset-bottom))',
        background: 'var(--bg)',
        borderTop: '1px solid var(--line-2)',
        borderRadius: 'var(--r-xl) var(--r-xl) 0 0',
        boxShadow: '0 -12px 40px rgba(0,0,0,.5)',
        pointerEvents: 'auto',
        willChange: 'transform',
      }}
    >
      {children}
    </div>
  )
}

// ── Run detail overlay ────────────────────────────────────────────────────────

export function RunDetailOverlay({
  id,
  enter = true,
  exiting: controlledExiting,
  onClose,
  onExited,
  backBehavior = 'route',
}: {
  id: string
  enter?: boolean
  exiting?: boolean
  onClose?: () => void
  onExited?: () => void
  backBehavior?: 'history' | 'route'
}) {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('explore')
  const tr = useCallback((k: string) => t(k as Parameters<typeof t>[0]), [t])

  const [run, setRun] = useState<RunDetailData | null>(null)
  const [error, setError] = useState(false)

  const closeDetail = useCallback(() => {
    if (backBehavior === 'history') {
      router.back()
      return
    }
    router.replace(`/${locale}`)
  }, [backBehavior, locale, router])
  const { exiting, requestClose, handleAnimationEnd } =
    useAnimatedClose(closeDetail)
  const isControlled = onClose !== undefined
  const isExiting = controlledExiting ?? exiting
  const requestPanelClose = onClose ?? requestClose
  const handlePanelAnimationEnd = useCallback(
    (event: AnimationEvent<HTMLDivElement>) => {
      if (!isControlled) {
        handleAnimationEnd(event)
        return
      }
      if (!isExiting) return
      if (event.target !== event.currentTarget) return
      if (event.animationName !== 'detailPanelOut') return
      onExited?.()
    },
    [handleAnimationEnd, isControlled, isExiting, onExited]
  )

  useEffect(() => {
    fetch(`/api/explore/runs/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error('not found')
        return r.json()
      })
      .then((data) => {
        // Compute isPast from date + time
        let isPast = false
        if (data.date && data.time) {
          const [h, m] = data.time.split(':').map(Number)
          // data.date is the UTC day boundary; add local run time offset
          const runEpoch =
            new Date(data.date).getTime() + ((h ?? 0) * 60 + (m ?? 0)) * 60000
          isPast = runEpoch < Date.now()
        }
        setRun({
          id: data.id,
          title: data.title,
          time: data.time,
          date: data.date ?? null,
          isPast,
          status: data.status,
          distance: data.distance ?? data.pace ?? null,
          address: data.address ?? null,
          lat: data.latitude ?? data.lat ?? null,
          lng: data.longitude ?? data.lng ?? null,
          club: {
            id: data.club?.id ?? '',
            slug: data.club?.slug ?? '',
            name: data.club?.name ?? '',
            description: data.club?.description ?? null,
            type: data.club?.type ?? null,
            vibe: data.club?.vibe ?? null,
            beginnerFriendly: data.club?.beginnerFriendly ?? false,
            paceMin: data.club?.paceMin ?? null,
            paceMax: data.club?.paceMax ?? null,
          },
        })
      })
      .catch(() => setError(true))
  }, [id])

  if (error) return null
  if (!run) {
    return (
      <OverlayShell
        enter={enter}
        exiting={isExiting}
        onExitComplete={handlePanelAnimationEnd}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="skel"
              style={{ height: 60, borderRadius: 'var(--r-lg)' }}
            />
          ))}
        </div>
      </OverlayShell>
    )
  }

  return (
    <OverlayShell
      enter={enter}
      exiting={isExiting}
      onExitComplete={handlePanelAnimationEnd}
    >
      <RunDetailPanel
        run={run}
        onBack={requestPanelClose}
        onOpenClub={(slug) => router.push(`/${locale}/clubs/${slug}`)}
        locale={locale}
        tr={tr}
      />
    </OverlayShell>
  )
}

// ── Club detail overlay ───────────────────────────────────────────────────────

export function ClubDetailOverlay({
  slug,
  enter = true,
  exiting: controlledExiting,
  onClose,
  onExited,
  backBehavior = 'route',
}: {
  slug: string
  enter?: boolean
  exiting?: boolean
  onClose?: () => void
  onExited?: () => void
  backBehavior?: 'history' | 'route'
}) {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('explore')
  const tr = useCallback((k: string) => t(k as Parameters<typeof t>[0]), [t])

  const [club, setClub] = useState<ClubDetailData | null>(null)
  const [error, setError] = useState(false)

  const closeDetail = useCallback(() => {
    if (backBehavior === 'history') {
      router.back()
      return
    }
    router.replace(`/${locale}/clubs`)
  }, [backBehavior, locale, router])
  const { exiting, requestClose, handleAnimationEnd } =
    useAnimatedClose(closeDetail)
  const isControlled = onClose !== undefined
  const isExiting = controlledExiting ?? exiting
  const requestPanelClose = onClose ?? requestClose
  const handlePanelAnimationEnd = useCallback(
    (event: AnimationEvent<HTMLDivElement>) => {
      if (!isControlled) {
        handleAnimationEnd(event)
        return
      }
      if (!isExiting) return
      if (event.target !== event.currentTarget) return
      if (event.animationName !== 'detailPanelOut') return
      onExited?.()
    },
    [handleAnimationEnd, isControlled, isExiting, onExited]
  )

  useEffect(() => {
    fetch(`/api/explore/clubs/${slug}?locale=${locale}`)
      .then((r) => {
        if (!r.ok) throw new Error('not found')
        return r.json()
      })
      .then((data: ClubForDetail) => {
        setClub({
          id: data.id,
          slug: data.slug,
          name: data.name,
          type: data.type,
          vibe: data.vibe,
          beginnerFriendly: data.beginnerFriendly,
          paceMin: data.paceMin,
          paceMax: data.paceMax,
          description: data.description,
          instagram: data.instagram,
          website: data.website,
          schedule: data.schedule,
          upcomingRuns: (data.upcomingRuns ?? []).map((run) => ({
            ...run,
            date: run.date instanceof Date ? run.date.toISOString() : run.date,
          })),
        })
      })
      .catch(() => setError(true))
  }, [slug, locale])

  if (error) return null
  if (!club) {
    return (
      <OverlayShell
        enter={enter}
        exiting={isExiting}
        onExitComplete={handlePanelAnimationEnd}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="skel"
              style={{ height: 60, borderRadius: 'var(--r-lg)' }}
            />
          ))}
        </div>
      </OverlayShell>
    )
  }

  return (
    <OverlayShell
      enter={enter}
      exiting={isExiting}
      onExitComplete={handlePanelAnimationEnd}
    >
      <ClubDetailPanel
        club={club}
        onBack={requestPanelClose}
        onOpenRun={(runId) => router.push(`/${locale}/run/${runId}`)}
        tr={tr}
      />
    </OverlayShell>
  )
}
