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
import { RunDetailPanel } from './run-detail'
import { ClubDetailPanel } from './club-detail'
import { useClubDetail, useRunDetail } from '@/lib/hooks/use-explore'

export const PANEL_ENTER_MS = 280
export const PANEL_EXIT_MS = 220

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
  inactive = false,
  onEnterComplete,
  onExitComplete,
}: {
  children: React.ReactNode
  enter?: boolean
  exiting?: boolean
  inactive?: boolean
  onEnterComplete?: () => void
  onExitComplete?: (event: AnimationEvent<HTMLDivElement>) => void
}) {
  const { theme } = useTheme()
  const className = `qr-root qr-panel-scroll qr-detail-shell${enter ? '' : ' is-static'}${exiting ? ' is-exiting' : ''}${inactive ? ' is-underlay' : ''}`

  return (
    <div
      className={className}
      aria-hidden={inactive}
      inert={inactive}
      onAnimationEnd={(event) => {
        if (
          event.target === event.currentTarget &&
          event.animationName === 'detailPanelIn'
        ) {
          onEnterComplete?.()
        }
        onExitComplete?.(event)
      }}
      data-theme={theme}
      suppressHydrationWarning
    >
      {children}
    </div>
  )
}

function SkeletonBlock({ width, height }: { width: string; height: number }) {
  return (
    <div
      className="skel"
      style={{ width, height, borderRadius: 'var(--r-md)' }}
    />
  )
}

function DetailSkeleton({ kind }: { kind: 'run' | 'club' }) {
  return (
    <div
      aria-busy="true"
      style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <SkeletonBlock width="82px" height={38} />
        <SkeletonBlock width="88px" height={38} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        <SkeletonBlock width={kind === 'run' ? '76%' : '58%'} height={31} />
        <SkeletonBlock width="44%" height={16} />
      </div>
      {kind === 'run' ? (
        <div
          className="skel"
          style={{ height: 104, borderRadius: 'var(--r-lg)' }}
        />
      ) : (
        <>
          <SkeletonBlock width="100%" height={16} />
          <SkeletonBlock width="84%" height={16} />
        </>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <SkeletonBlock width="82px" height={28} />
        <SkeletonBlock width="96px" height={28} />
      </div>
      <SkeletonBlock width="38%" height={12} />
      <div
        className="skel"
        style={{
          height: kind === 'run' ? 116 : 188,
          borderRadius: 'var(--r-lg)',
        }}
      />
      <SkeletonBlock width="42%" height={12} />
      <div
        className="skel"
        style={{ height: 78, borderRadius: 'var(--r-lg)' }}
      />
    </div>
  )
}

function DetailError({
  kind,
  onBack,
  onRetry,
}: {
  kind: 'run' | 'club'
  onBack: () => void
  onRetry: () => void
}) {
  const t = useTranslations('explore')

  return (
    <div
      role="alert"
      style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        textAlign: 'center',
      }}
    >
      <h1 style={{ margin: 0, fontSize: 24 }}>
        {kind === 'run' ? t('detail_error_run') : t('detail_error_club')}
      </h1>
      <div style={{ display: 'flex', gap: 9 }}>
        <button className="tap" onClick={onBack} style={errorButtonStyle}>
          {t('detail_error_back')}
        </button>
        <button
          className="tap"
          onClick={onRetry}
          style={{
            ...errorButtonStyle,
            borderColor: 'transparent',
            background: 'var(--lime)',
            color: 'var(--lime-ink)',
          }}
        >
          {t('detail_error_retry')}
        </button>
      </div>
    </div>
  )
}

const errorButtonStyle = {
  border: '1px solid var(--line)',
  background: 'var(--surface)',
  color: 'var(--text)',
  borderRadius: 100,
  padding: '10px 16px',
  fontFamily: 'var(--font-ui)',
  fontWeight: 700,
  fontSize: 14,
  cursor: 'pointer',
} as const

// ── Overlay plumbing shared by both kinds ─────────────────────────────────────

type OverlayProps = {
  enter?: boolean
  exiting?: boolean
  inactive?: boolean
  onClose?: () => void
  onEntered?: () => void
  onExited?: () => void
  backBehavior?: 'history' | 'route'
}

function useOverlay({
  fallbackPath,
  onClose,
  onExited,
  exiting: controlledExiting,
  backBehavior,
}: {
  fallbackPath: string
} & Pick<OverlayProps, 'onClose' | 'onExited' | 'exiting' | 'backBehavior'>) {
  const router = useRouter()

  const closeDetail = useCallback(() => {
    if (backBehavior === 'history') {
      router.back()
      return
    }
    router.replace(fallbackPath)
  }, [backBehavior, fallbackPath, router])

  const { exiting, requestClose, handleAnimationEnd } =
    useAnimatedClose(closeDetail)
  const isControlled = onClose !== undefined
  const isExiting = controlledExiting ?? exiting

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

  return {
    router,
    isExiting,
    requestPanelClose: onClose ?? requestClose,
    handlePanelAnimationEnd,
  }
}

// ── Run detail overlay ────────────────────────────────────────────────────────

export function RunDetailOverlay({
  id,
  enter = true,
  exiting: controlledExiting,
  inactive = false,
  onClose,
  onEntered,
  onExited,
  backBehavior = 'route',
}: OverlayProps & { id: string }) {
  const locale = useLocale()
  const { data: run, isError, refetch } = useRunDetail(id)
  const { router, isExiting, requestPanelClose, handlePanelAnimationEnd } =
    useOverlay({
      fallbackPath: `/${locale}`,
      onClose,
      onExited,
      exiting: controlledExiting,
      backBehavior,
    })

  const shell = {
    enter,
    exiting: isExiting,
    inactive,
    onEnterComplete: onEntered,
    onExitComplete: handlePanelAnimationEnd,
  }

  if (isError) {
    return (
      <OverlayShell {...shell}>
        <DetailError
          kind="run"
          onBack={requestPanelClose}
          onRetry={() => void refetch()}
        />
      </OverlayShell>
    )
  }
  if (!run) {
    return (
      <OverlayShell {...shell}>
        <DetailSkeleton kind="run" />
      </OverlayShell>
    )
  }

  return (
    <OverlayShell {...shell}>
      <RunDetailPanel
        run={run}
        onBack={requestPanelClose}
        onOpenClub={(slug) => router.push(`/${locale}/clubs/${slug}`)}
        locale={locale}
      />
    </OverlayShell>
  )
}

// ── Club detail overlay ───────────────────────────────────────────────────────

export function ClubDetailOverlay({
  slug,
  enter = true,
  exiting: controlledExiting,
  inactive = false,
  onClose,
  onEntered,
  onExited,
  backBehavior = 'route',
}: OverlayProps & { slug: string }) {
  const locale = useLocale()
  const { data: club, isError, refetch } = useClubDetail(slug, locale)
  const { router, isExiting, requestPanelClose, handlePanelAnimationEnd } =
    useOverlay({
      fallbackPath: `/${locale}/clubs`,
      onClose,
      onExited,
      exiting: controlledExiting,
      backBehavior,
    })

  const shell = {
    enter,
    exiting: isExiting,
    inactive,
    onEnterComplete: onEntered,
    onExitComplete: handlePanelAnimationEnd,
  }

  if (isError) {
    return (
      <OverlayShell {...shell}>
        <DetailError
          kind="club"
          onBack={requestPanelClose}
          onRetry={() => void refetch()}
        />
      </OverlayShell>
    )
  }
  if (!club) {
    return (
      <OverlayShell {...shell}>
        <DetailSkeleton kind="club" />
      </OverlayShell>
    )
  }

  return (
    <OverlayShell {...shell}>
      <ClubDetailPanel
        club={club}
        onBack={requestPanelClose}
        onOpenRun={(runId) => router.push(`/${locale}/run/${runId}`)}
      />
    </OverlayShell>
  )
}
