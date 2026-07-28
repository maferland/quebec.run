'use client'
import { useCallback, type AnimationEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useTheme } from './theme-provider'
import { RunDetailPanel } from './run-detail'
import { ClubDetailPanel } from './club-detail'
import { useClubDetail, useRunDetail } from '@/lib/hooks/use-explore'
import type { DetailOverlayState } from './use-detail-route'

export const PANEL_ENTER_MS = 280
export const PANEL_EXIT_MS = 220

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

// ── Overlay ───────────────────────────────────────────────────────────────────

// Close, enter and exit are driven entirely by useDetailRoute in the shell;
// this component only reports animation completion back to it.
export function DetailOverlay({
  overlay,
  inactive = false,
  onClose,
  onEntered,
  onExited,
}: {
  overlay: DetailOverlayState
  inactive?: boolean
  onClose?: () => void
  onEntered?: () => void
  onExited?: () => void
}) {
  const locale = useLocale()
  const router = useRouter()
  const isRun = overlay.kind === 'run'

  const runQuery = useRunDetail(isRun ? overlay.id : null)
  const clubQuery = useClubDetail(isRun ? null : overlay.slug, locale)
  const { isError, refetch } = isRun ? runQuery : clubQuery

  const exiting = inactive ? false : overlay.exiting

  const handleAnimationEnd = useCallback(
    (event: AnimationEvent<HTMLDivElement>) => {
      if (!exiting) return
      if (event.target !== event.currentTarget) return
      if (event.animationName !== 'detailPanelOut') return
      onExited?.()
    },
    [exiting, onExited]
  )

  const shell = {
    enter: inactive ? false : overlay.enter,
    exiting,
    inactive,
    onEnterComplete: onEntered,
    onExitComplete: handleAnimationEnd,
  }

  const close = () => onClose?.()

  // Branching on kind before reading the data is what keeps this free of
  // non-null assertions.
  const panel = isRun
    ? runQuery.data && (
        <RunDetailPanel
          run={runQuery.data}
          onBack={close}
          onOpenClub={(slug) => router.push(`/${locale}/clubs/${slug}`)}
          locale={locale}
          animateIn={overlay.enter}
        />
      )
    : clubQuery.data && (
        <ClubDetailPanel
          club={clubQuery.data}
          onBack={close}
          onOpenRun={(runId) => router.push(`/${locale}/run/${runId}`)}
          animateIn={overlay.enter}
        />
      )

  if (isError) {
    return (
      <OverlayShell {...shell}>
        <DetailError
          kind={overlay.kind}
          onBack={close}
          onRetry={() => void refetch()}
        />
      </OverlayShell>
    )
  }

  return (
    <OverlayShell {...shell}>
      {panel ?? <DetailSkeleton kind={overlay.kind} />}
    </OverlayShell>
  )
}
