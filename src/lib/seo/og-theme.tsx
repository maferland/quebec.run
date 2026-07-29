import { BrandMark } from './brand-mark'

// Satori cannot read CSS custom properties, so the app's --bg, --bg-2 and
// --accent tokens are rasterised here rather than re-invented per card.
export const OG_SURFACE = 'linear-gradient(135deg, #111419 0%, #1d2027 100%)'
export const OG_GLOW =
  'radial-gradient(560px 560px at 860px 40px, rgba(183,155,255,0.20), transparent 70%)'
export const OG_TILE = '#2a2350'
export const OG_ACCENT = '#d2a8fe'
export const OG_TEXT = '#f6f5f8'
export const OG_DIM = '#b7bac4'

export const OG_SIZE = { width: 1200, height: 630 }

export const ogCardStyle = {
  position: 'relative' as const,
  display: 'flex',
  flexDirection: 'column' as const,
  justifyContent: 'space-between' as const,
  width: '100%',
  height: '100%',
  padding: 80,
  backgroundImage: OG_SURFACE,
  color: OG_TEXT,
  fontFamily: 'sans-serif',
}

export function OgGlow() {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        display: 'flex',
        ...OG_SIZE,
        backgroundImage: OG_GLOW,
      }}
    />
  )
}

// The mark is one size on every card. A kicker turns the wordmark into a
// two-line lockup, which only changes the type size, never the mark.
export function BrandLockup({ kicker }: { kicker?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 104,
          height: 104,
          borderRadius: 24,
          background: OG_TILE,
        }}
      >
        <BrandMark size={72} />
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          fontSize: kicker ? 28 : 40,
          letterSpacing: '-0.01em',
          color: kicker ? OG_DIM : OG_TEXT,
        }}
      >
        <div style={{ display: 'flex', fontWeight: 800 }}>
          quebec&nbsp;.&nbsp;run
        </div>
        {kicker && <div style={{ display: 'flex' }}>{kicker}</div>}
      </div>
    </div>
  )
}
