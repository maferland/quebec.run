'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

// Replaces the root layout, so globals.css, the fonts and next-intl are all
// unavailable. Everything here is inlined and both languages are shown.
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string }
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: 28,
          background: 'oklch(0.165 0.012 264)',
          color: 'oklch(0.965 0.004 100)',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 420 }}>
          <div
            style={{
              fontSize: 82,
              fontWeight: 700,
              letterSpacing: '-0.04em',
              lineHeight: 1,
              color: 'oklch(0.73 0.17 32)',
            }}
          >
            500
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: '14px 0 0' }}>
            On a frappé le mur.
          </h1>
          <p
            style={{
              fontSize: 15.5,
              lineHeight: 1.6,
              margin: '11px 0 0',
              color: 'oklch(0.74 0.012 264)',
            }}
          >
            We hit the wall. Réessaie dans un instant.
          </p>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- root layout crashed; force a full reload rather than client nav back into it */}
          <a
            href="/"
            style={{
              display: 'inline-block',
              marginTop: 26,
              padding: '13px 22px',
              borderRadius: 100,
              background: 'oklch(0.82 0.13 300)',
              color: 'oklch(0.27 0.08 300)',
              fontWeight: 700,
              fontSize: 15,
              textDecoration: 'none',
            }}
          >
            quebec.run
          </a>
        </div>
      </body>
    </html>
  )
}
