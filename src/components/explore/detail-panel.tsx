'use client'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useTheme } from './theme-provider'
import { RunDetailPanel, type RunDetailData } from './run-detail'
import { ClubDetailPanel, type ClubDetailData } from './club-detail'
import type { ClubForDetail } from '@/lib/services/clubs'

const RAIL_WIDTH = 404

// ── Shared overlay shell ──────────────────────────────────────────────────────

function OverlayShell({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme()
  const [desktop, setDesktop] = useState(false)
  useEffect(() => {
    const check = () => setDesktop(window.innerWidth >= 880)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  if (desktop) {
    return (
      <div
        className="qr-root"
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
        }}
      >
        {children}
      </div>
    )
  }

  return (
    <div
      className="qr-root"
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
      }}
    >
      {children}
    </div>
  )
}

// ── Run detail overlay ────────────────────────────────────────────────────────

export function RunDetailOverlay({ id }: { id: string }) {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('explore')
  const tr = useCallback((k: string) => t(k as Parameters<typeof t>[0]), [t])

  const [run, setRun] = useState<RunDetailData | null>(null)
  const [error, setError] = useState(false)

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
      <OverlayShell>
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
    <OverlayShell>
      <RunDetailPanel
        run={run}
        onBack={() => router.back()}
        onOpenClub={(slug) => router.push(`/${locale}/clubs/${slug}`)}
        locale={locale}
        tr={tr}
      />
    </OverlayShell>
  )
}

// ── Club detail overlay ───────────────────────────────────────────────────────

export function ClubDetailOverlay({ slug }: { slug: string }) {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('explore')
  const tr = useCallback((k: string) => t(k as Parameters<typeof t>[0]), [t])

  const [club, setClub] = useState<ClubDetailData | null>(null)
  const [error, setError] = useState(false)

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
      <OverlayShell>
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
    <OverlayShell>
      <ClubDetailPanel
        club={club}
        onBack={() => router.back()}
        onOpenRun={(runId) => router.push(`/${locale}/run/${runId}`)}
        tr={tr}
      />
    </OverlayShell>
  )
}
