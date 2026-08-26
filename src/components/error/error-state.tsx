import type { ReactNode } from 'react'
import { Link } from '@/i18n/navigation'
import { BrandMark } from '@/lib/seo/brand-mark'

export function HomeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h5v-6h4v6h5V10" />
    </svg>
  )
}

export function RetryIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  )
}

// 4xx: the 0 is a running track, the runner laps it then strays off course.
export function TrackGlyph() {
  return (
    <div className="qr-error-glyph">
      <span>4</span>
      <span className="qr-error-oval">
        <svg viewBox="0 0 96 104" aria-hidden="true">
          <path className="qr-error-lane" d="M48 12 a36 46 0 1 1 -0.1 0" />
          <path
            className="qr-error-lane is-dash"
            d="M48 12 a36 46 0 1 1 -0.1 0"
          />
          <path className="qr-error-stray" d="M74 40 q26 6 20 40" />
          <circle className="qr-error-runner" r="6.5" cx="0" cy="0" />
        </svg>
      </span>
      <span>4</span>
    </div>
  )
}

// 5xx: hit the wall, coral bolt plus an expanding shockwave.
function WallGlyph() {
  return (
    <div className="qr-error-glyph">
      <span className="qr-error-wallnum">
        <svg
          className="qr-error-bolt"
          width="46"
          height="46"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M13 2L5 13h6l-1 9 8-11h-6l1-9Z" />
        </svg>
        <span className="qr-error-ripple" />
        500
      </span>
    </div>
  )
}

type ErrorStateProps = {
  variant: 'track' | 'wall'
  title: string
  lede: string
  meta: string
  actions: ReactNode
  quip?: ReactNode
}

// Carries its own .qr-root: the tokens are scoped there and these pages
// render outside the (site) layout that would otherwise provide it.
export function ErrorState({
  variant,
  title,
  lede,
  meta,
  actions,
  quip,
}: ErrorStateProps) {
  return (
    <div
      className={`qr-root qr-error-root${variant === 'wall' ? ' is-fault' : ''}`}
    >
      <div className="qr-error-tex" aria-hidden="true" />
      <div className="qr-error-wrap">
        <Link href="/" className="qr-error-brand">
          <BrandMark size={26} fill="var(--accent)" />
          <span>
            quebec<span style={{ color: 'var(--accent)' }}>.run</span>
          </span>
        </Link>

        <div className="qr-error-stage">
          {variant === 'track' ? <TrackGlyph /> : <WallGlyph />}
        </div>

        <h1 className="qr-error-title">{title}</h1>
        <p className="qr-error-lede">{lede}</p>
        {quip}
        <div className="qr-error-actions">{actions}</div>
        <div className="qr-error-meta">{meta}</div>
      </div>
    </div>
  )
}
