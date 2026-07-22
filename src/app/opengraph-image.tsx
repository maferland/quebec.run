import { ImageResponse } from 'next/og'

export const alt = 'quebec.run running clubs and events in Quebec City'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: 'center',
        background: '#090c12',
        color: '#f6f5f8',
        display: 'flex',
        height: '100%',
        justifyContent: 'center',
        width: '100%',
      }}
    >
      <div style={{ alignItems: 'center', display: 'flex', gap: 30 }}>
        <div
          style={{
            alignItems: 'center',
            background: '#caa6ff',
            borderRadius: 24,
            color: '#2f1748',
            display: 'flex',
            fontSize: 72,
            fontWeight: 700,
            height: 124,
            justifyContent: 'center',
            width: 124,
          }}
        >
          Q
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 78, fontWeight: 700 }}>quebec.run</div>
          <div style={{ color: '#b7bac4', fontSize: 30 }}>
            Running clubs and events in Quebec City
          </div>
        </div>
      </div>
    </div>,
    size
  )
}
