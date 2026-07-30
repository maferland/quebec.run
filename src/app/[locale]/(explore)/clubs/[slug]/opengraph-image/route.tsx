import { ImageResponse } from 'next/og'
import { getTranslations } from 'next-intl/server'
import { getClubBySlug } from '@/lib/services/clubs'
import {
  BrandLockup,
  OgFooter,
  OgGlow,
  OG_DIM,
  ogCardStyle,
  truncateForCard,
} from '@/lib/seo/og-theme'

export const revalidate = 900
export const dynamicParams = true

const MAX_DESCRIPTION_LENGTH = 140

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
        {club.description && (
          <div style={{ display: 'flex', fontSize: 28, color: OG_DIM }}>
            {truncateForCard(club.description, MAX_DESCRIPTION_LENGTH)}
          </div>
        )}
      </div>
      <OgFooter />
    </div>,
    { width: 1200, height: 630 }
  )
}
