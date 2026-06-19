'use client'
import { useEffect, useState } from 'react'
import { FilterPanel, type Filters } from './filter-panel'

const RAIL_WIDTH = 404

const XIcon = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)

type Props = {
  desktop: boolean
  filters: Filters
  setFilters: (fn: (prev: Filters) => Filters) => void
  onClose: () => void
  resultCount: number
  showTod: boolean
  locale: string
  tr: (k: string) => string
}

export function FilterOverlay({
  desktop,
  filters,
  setFilters,
  onClose,
  resultCount,
  showTod,
  locale,
  tr,
}: Props) {
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const header = (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
      }}
    >
      <h2 style={{ fontSize: 19, margin: 0 }}>{tr('filters')}</h2>
      <button
        className="tap"
        onClick={onClose}
        style={{
          border: 'none',
          background: 'var(--surface)',
          color: 'var(--dim)',
          width: 34,
          height: 34,
          borderRadius: 100,
          display: 'grid',
          placeItems: 'center',
          cursor: 'pointer',
        }}
      >
        {XIcon}
      </button>
    </div>
  )

  if (desktop) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 60,
          pointerEvents: 'none',
        }}
      >
        {/* backdrop — only right of rail */}
        <div
          className="tap filter-backdrop"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: RAIL_WIDTH,
            right: 0,
            pointerEvents: 'auto',
            opacity: shown ? 1 : 0,
            transition: 'opacity .28s ease',
          }}
        />
        {/* floating card */}
        <div
          className="qr-scroll"
          style={{
            position: 'absolute',
            top: 92,
            left: RAIL_WIDTH + 20,
            width: 340,
            maxHeight: 'calc(100% - 132px)',
            pointerEvents: 'auto',
            background: 'var(--bg-2)',
            border: '1px solid var(--line-2)',
            borderRadius: 'var(--r-xl)',
            boxShadow:
              '0 24px 70px -12px rgba(0,0,0,.55), 0 6px 20px rgba(0,0,0,.3)',
            overflowY: 'auto',
            padding: '22px 20px 24px',
            display: 'flex',
            flexDirection: 'column',
            transform: shown ? 'none' : 'translateY(10px) scale(0.985)',
            opacity: shown ? 1 : 0,
            transformOrigin: 'top left',
            transition:
              'transform .32s cubic-bezier(.2,.7,.3,1), opacity .24s ease',
          }}
        >
          {header}
          <FilterPanel
            filters={filters}
            setFilters={setFilters}
            onClose={onClose}
            resultCount={resultCount}
            showTod={showTod}
            loading={false}
            locale={locale}
            tr={tr}
          />
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        display: 'flex',
        alignItems: 'flex-end',
      }}
    >
      <div
        className="tap filter-backdrop"
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          opacity: shown ? 1 : 0,
          transition: 'opacity .3s ease',
        }}
      />
      <div
        className="qr-scroll"
        style={{
          position: 'relative',
          width: '100%',
          maxHeight: '86%',
          overflowY: 'auto',
          background: 'var(--bg-2)',
          borderTop: '1px solid var(--line-2)',
          borderRadius: 'var(--r-xl) var(--r-xl) 0 0',
          padding: '14px 20px calc(22px + env(safe-area-inset-bottom))',
          boxShadow: '0 -16px 50px rgba(0,0,0,.55)',
          transform: shown ? 'none' : 'translateY(101%)',
          transition: 'transform .36s cubic-bezier(.2,.7,.3,1)',
        }}
      >
        <div className="sheet-grip" style={{ marginBottom: 16 }} />
        {header}
        <FilterPanel
          filters={filters}
          setFilters={setFilters}
          onClose={onClose}
          resultCount={resultCount}
          showTod={showTod}
          loading={false}
          locale={locale}
          tr={tr}
        />
      </div>
    </div>
  )
}
