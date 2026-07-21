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

export const PANEL_EXIT_MS = 180

const runDetailRequests = new Map<string, Promise<RunDetailData>>()
const clubDetailRequests = new Map<string, Promise<ClubDetailData>>()

type RunDetailResponse = {
  id: string
  title: string
  time: string
  date?: string | null
  status: 'SCHEDULED' | 'CANCELLED'
  distance?: string | null
  pace?: string | null
  address?: string | null
  latitude?: number | null
  longitude?: number | null
  lat?: number | null
  lng?: number | null
  club?: Partial<RunDetailData['club']>
}

function cacheRequest<T>(
  cache: Map<string, Promise<T>>,
  key: string,
  request: () => Promise<T>
) {
  const cached = cache.get(key)
  if (cached) return cached

  const pending = request().catch((error) => {
    cache.delete(key)
    throw error
  })
  cache.set(key, pending)
  return pending
}

function loadRunDetail(id: string) {
  return cacheRequest(runDetailRequests, id, async () => {
    const response = await fetch(`/api/explore/runs/${id}`)
    if (!response.ok) throw new Error('Run not found')
    const data = (await response.json()) as RunDetailResponse

    let isPast = false
    if (data.date && data.time) {
      const [hour, minute] = data.time.split(':').map(Number)
      const runEpoch =
        new Date(data.date).getTime() +
        ((hour ?? 0) * 60 + (minute ?? 0)) * 60000
      isPast = runEpoch < Date.now()
    }

    return {
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
    }
  })
}

function loadClubDetail(slug: string, locale: string) {
  const key = `${locale}:${slug}`
  return cacheRequest(clubDetailRequests, key, async () => {
    const response = await fetch(`/api/explore/clubs/${slug}?locale=${locale}`)
    if (!response.ok) throw new Error('Club not found')
    const data = (await response.json()) as ClubForDetail

    return {
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
    }
  })
}

export function preloadRunDetail(id: string) {
  void loadRunDetail(id).catch(() => {})
}

export function preloadClubDetail(slug: string, locale: string) {
  void loadClubDetail(slug, locale).catch(() => {})
}

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
  const className = `qr-root qr-panel-scroll qr-detail-shell${enter ? '' : ' is-static'}${exiting ? ' is-exiting' : ''}`

  return (
    <div
      className={className}
      onAnimationEnd={onExitComplete}
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
    let active = true
    loadRunDetail(id)
      .then((data) => {
        if (active) setRun(data)
      })
      .catch(() => {
        if (active) setError(true)
      })
    return () => {
      active = false
    }
  }, [id])

  if (error) return null
  if (!run) {
    return (
      <OverlayShell
        enter={enter}
        exiting={isExiting}
        onExitComplete={handlePanelAnimationEnd}
      >
        <DetailSkeleton kind="run" />
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
    let active = true
    loadClubDetail(slug, locale)
      .then((data) => {
        if (active) setClub(data)
      })
      .catch(() => {
        if (active) setError(true)
      })
    return () => {
      active = false
    }
  }, [slug, locale])

  if (error) return null
  if (!club) {
    return (
      <OverlayShell
        enter={enter}
        exiting={isExiting}
        onExitComplete={handlePanelAnimationEnd}
      >
        <DetailSkeleton kind="club" />
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
