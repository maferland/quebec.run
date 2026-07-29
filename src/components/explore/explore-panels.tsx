'use client'
import type { useSheetDrag } from './use-explore-layout'

type SheetDrag = ReturnType<typeof useSheetDrag>

export const RAIL_WIDTH = 404

const MOBILE_TOP_INSET = 76

// Keeps map content clear of the rail, the sheet, or an open detail panel.
export function mapInsets({
  desktop,
  containerHeight,
  sheetHeight,
  detailOpen,
}: {
  desktop: boolean
  containerHeight: number
  sheetHeight: number
  detailOpen: boolean
}) {
  if (desktop) return { left: RAIL_WIDTH + 24, top: 24, bottom: 24 }
  if (detailOpen) {
    const visible = Math.min(300, Math.max(220, containerHeight * 0.3))
    return {
      left: 0,
      top: MOBILE_TOP_INSET,
      bottom: Math.max(0, containerHeight - visible),
    }
  }
  return { left: 0, top: MOBILE_TOP_INSET, bottom: sheetHeight }
}

type ListContainerProps = {
  listRef: React.RefObject<HTMLDivElement | null>
  controls: React.ReactNode
  children: React.ReactNode
}

export function DesktopRail({
  listRef,
  controls,
  children,
}: ListContainerProps) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        width: RAIL_WIDTH,
        zIndex: 35,
        display: 'flex',
        flexDirection: 'column',
        background: 'color-mix(in oklch, var(--bg) 88%, transparent)',
        backdropFilter: 'blur(16px)',
        borderRight: '1px solid var(--line)',
        boxShadow: '8px 0 40px rgba(0,0,0,.4)',
      }}
    >
      <div style={{ height: 94, flexShrink: 0 }} />
      <div
        style={{
          padding: '4px 18px 14px',
          borderBottom: '1px solid var(--line)',
          flexShrink: 0,
        }}
      >
        {controls}
      </div>
      <div
        ref={listRef}
        className="qr-themed-scroll"
        style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 26px' }}
      >
        {children}
      </div>
    </div>
  )
}

export function MobileSheet({
  listRef,
  controls,
  children,
  height,
  dragging,
  gripHandlers,
}: ListContainerProps &
  Pick<SheetDrag, 'height' | 'dragging' | 'gripHandlers'>) {
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: height || '60dvh',
        zIndex: 35,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg)',
        borderTop: '1px solid var(--line-2)',
        borderRadius: 'var(--r-xl) var(--r-xl) 0 0',
        boxShadow: '0 -12px 40px rgba(0,0,0,.5)',
        transition: dragging ? 'none' : 'height .34s cubic-bezier(.2,.7,.3,1)',
        overflow: 'hidden',
      }}
    >
      <div
        {...gripHandlers}
        style={{
          flexShrink: 0,
          padding: '10px 16px 8px',
          cursor: 'grab',
          touchAction: 'none',
        }}
      >
        <div
          style={{
            width: 36,
            height: 4,
            borderRadius: 2,
            background: 'var(--line-2)',
            margin: '0 auto',
          }}
        />
      </div>
      <div style={{ flexShrink: 0, padding: '0 16px 12px' }}>{controls}</div>
      <div
        ref={listRef}
        className="qr-themed-scroll"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '4px 16px calc(22px + env(safe-area-inset-bottom))',
        }}
      >
        {children}
      </div>
    </div>
  )
}
