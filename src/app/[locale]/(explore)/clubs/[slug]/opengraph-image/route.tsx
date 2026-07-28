import { ImageResponse } from 'next/og'
import { getTranslations } from 'next-intl/server'
import { getClubBySlug } from '@/lib/services/clubs'
import { BrandMark } from '@/lib/seo/brand-mark'

export const revalidate = 900
export const dynamicParams = true

const ACCENT = '#d2a8fe'
const MAX_DESCRIPTION_LENGTH = 140

function truncate(text: string, maxLength: number) {
  if (text.length <= maxLength) return text
  const clipped = text.slice(0, maxLength)
  const lastSpace = clipped.lastIndexOf(' ')
  return `${(lastSpace > 0 ? clipped.slice(0, lastSpace) : clipped).trimEnd()}…`
}

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
  const name = club?.name ?? slug

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
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 72,
            height: 72,
            borderRadius: 18,
            background: '#2a2350',
          }}
        >
          <BrandMark size={50} />
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            fontSize: 26,
            color: '#b7bac4',
          }}
        >
          <div style={{ display: 'flex', fontWeight: 800 }}>
            quebec&nbsp;.&nbsp;run
          </div>
          <div style={{ display: 'flex' }}>{t('ogKicker')}</div>
        </div>
      </div>
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
          {name}
        </div>
        {club?.description && (
          <div style={{ display: 'flex', fontSize: 28, color: '#b7bac4' }}>
            {truncate(club.description, MAX_DESCRIPTION_LENGTH)}
          </div>
        )}
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
    { width: 1200, height: 630 }
  )
}
