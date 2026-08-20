import { ImageResponse } from 'next/og'
import { getTranslations } from 'next-intl/server'
import { getEventById } from '@/lib/services/events'
import { formatEventDate } from '@/lib/utils/intl'
import {
  BrandLockup,
  OgGlow,
  OG_ACCENT,
  OG_DIM,
  ogCardStyle,
} from '@/lib/seo/og-theme'

// Next.js requires a literal here; keep in sync with PUBLIC_PAGE_REVALIDATE_SECONDS in public-cache.ts.
export const revalidate = 21600
export const dynamicParams = true

type Params = { locale: string; id: string }

export async function GET(
  _request: Request,
  { params }: { params: Promise<Params> }
) {
  const { locale, id } = await params
  const [event, t] = await Promise.all([
    getEventById({ data: { id } }).catch(() => null),
    getTranslations({ locale, namespace: 'metadata.eventDetail' }),
  ])

  // The page 404s for an unknown id or a clubless event, so the preview must
  // not claim it exists.
  if (!event?.club) return new Response(null, { status: 404 })

  const dateLabel = formatEventDate(event.date, locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return new ImageResponse(
    <div style={ogCardStyle}>
      <OgGlow />
      <BrandLockup kicker={t('ogKicker')} />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          maxWidth: 960,
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 64,
            fontWeight: 800,
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}
        >
          {event.title}
        </div>
        <div style={{ display: 'flex', fontSize: 28, color: OG_DIM }}>
          {event.club.name} · {dateLabel} · {event.time}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            display: 'flex',
            width: 10,
            height: 10,
            borderRadius: 5,
            background: OG_ACCENT,
          }}
        />
        <div style={{ display: 'flex', fontSize: 24, color: OG_DIM }}>
          quebec.run
        </div>
      </div>
    </div>,
    { width: 1200, height: 630 }
  )
}
