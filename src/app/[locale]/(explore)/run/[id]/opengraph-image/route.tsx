import { ImageResponse } from 'next/og'
import { getTranslations } from 'next-intl/server'
import { getEventById } from '@/lib/services/events'
import {
  BrandLockup,
  OgFooter,
  OgGlow,
  OG_ACCENT,
  OG_DIM,
  OG_SIZE,
  ogCardStyle,
  truncateForCard,
} from '@/lib/seo/og-theme'
import { formatEventDate } from '@/lib/utils/intl'

export const revalidate = 900
export const dynamicParams = true

const MAX_TITLE_LENGTH = 70

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

  // The page 404s for an unknown id, so the preview must not claim it exists.
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
          {truncateForCard(event.title, MAX_TITLE_LENGTH)}
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 32,
            fontWeight: 600,
            color: OG_ACCENT,
          }}
        >
          {[dateLabel, event.time].filter(Boolean).join(' • ')}
        </div>
        <div style={{ display: 'flex', fontSize: 28, color: OG_DIM }}>
          {event.club.name}
        </div>
      </div>
      <OgFooter />
    </div>,
    OG_SIZE
  )
}
