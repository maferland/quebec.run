import { ImageResponse } from 'next/og'
import { getTranslations } from 'next-intl/server'
import { BrandMark } from '@/lib/seo/brand-mark'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

type Props = { params: Promise<{ locale: string }> }

const ACCENT = '#d2a8fe'

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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        padding: 80,
        background: '#161b26',
        color: '#f6f5f8',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 104,
            height: 104,
            borderRadius: 24,
            background: '#2a2350',
          }}
        >
          <BrandMark size={72} />
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 40,
            fontWeight: 800,
            letterSpacing: '-0.01em',
          }}
        >
          quebec&nbsp;.&nbsp;run
        </div>
      </div>
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
              style={{ color: ACCENT }}
            >{` ${accent}${after ? ' ' : ''}`}</span>
          )}
          {after && <span>{after}</span>}
        </div>
        <div style={{ display: 'flex', fontSize: 30, color: '#b7bac4' }}>
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
            background: ACCENT,
          }}
        />
        <div style={{ display: 'flex', fontSize: 24, color: '#b7bac4' }}>
          quebec.run
        </div>
      </div>
    </div>,
    size
  )
}
