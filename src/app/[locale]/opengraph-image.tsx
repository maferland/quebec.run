import { ImageResponse } from 'next/og'
import { getTranslations } from 'next-intl/server'
import {
  BrandLockup,
  OgGlow,
  OG_ACCENT,
  OG_DIM,
  ogCardStyle,
} from '@/lib/seo/og-theme'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

type Props = { params: Promise<{ locale: string }> }

export default async function Image({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'metadata.home' })

  const headline = t('ogImageHeadline')
  const accent = t('ogImageAccent')
  const accentIndex = headline.indexOf(accent)
  const before =
    accentIndex >= 0 ? headline.slice(0, accentIndex).trimEnd() : headline
  const after =
    accentIndex >= 0
      ? headline.slice(accentIndex + accent.length).trimStart()
      : ''

  return new ImageResponse(
    <div style={ogCardStyle}>
      <OgGlow />
      <BrandLockup />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          maxWidth: 920,
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
          <span>{before}</span>
          {accentIndex >= 0 && (
            <span
              style={{ color: OG_ACCENT }}
            >{` ${accent}${after ? ' ' : ''}`}</span>
          )}
          {after && <span>{after}</span>}
        </div>
        <div style={{ display: 'flex', fontSize: 30, color: OG_DIM }}>
          {t('ogDescription')}
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
    size
  )
}
