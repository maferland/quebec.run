import { ImageResponse } from 'next/og'
import { getTranslations } from 'next-intl/server'
import { getClubBySlug } from '@/lib/services/clubs'
import {
  BrandLockup,
  OgGlow,
  OG_ACCENT,
  OG_DIM,
  ogCardStyle,
} from '@/lib/seo/og-theme'

// Next.js requires a literal here; keep in sync with PUBLIC_PAGE_REVALIDATE_SECONDS in public-cache.ts.
export const revalidate = 86400
export const dynamicParams = true

type Params = { locale: string; slug: string }

export async function GET(
  _request: Request,
  { params }: { params: Promise<Params> }
) {
  const { locale, slug } = await params
  const [club, t] = await Promise.all([
    getClubBySlug({ slug }).catch(() => null),
    getTranslations({ locale, namespace: 'metadata.clubDetail' }),
  ])

  // The page 404s for an unknown slug, so the preview must not claim it exists.
  if (!club) return new Response(null, { status: 404 })

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
          {club.name}
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
