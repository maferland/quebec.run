import './globals.css'
import { BrandMark } from '@/lib/seo/brand-mark'
import { HomeIcon, TrackGlyph } from '@/components/error/error-state'

// A URL matching no route resolves to the ROOT not-found, skipping [locale],
// so there is no locale context and no <html> from the pass-through layout.
export default function NotFound() {
  return (
    <html lang="fr">
      <body style={{ margin: 0 }}>
        <div className="qr-root qr-error-root">
          <div className="qr-error-tex" aria-hidden="true" />
          <div className="qr-error-wrap">
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- no router context outside [locale] */}
            <a href="/" className="qr-error-brand">
              <BrandMark size={26} fill="var(--accent)" />
              <span>
                quebec<span style={{ color: 'var(--accent)' }}>.run</span>
              </span>
            </a>

            <div className="qr-error-stage">
              <TrackGlyph />
            </div>

            <h1 className="qr-error-title">Tu as pris un détour.</h1>
            <p className="qr-error-lede">
              Cette page n&apos;est pas sur le parcours. Elle a bifurqué quelque
              part, mais la carte t&apos;attend toujours.
            </p>
            <div className="qr-error-actions">
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- no router context outside [locale] */}
              <a href="/" className="qr-error-btn is-primary">
                <HomeIcon />
                Retour à l&apos;accueil
              </a>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- no router context outside [locale] */}
              <a href="/clubs" className="qr-error-btn is-ghost">
                Voir les clubs
              </a>
            </div>
            <div className="qr-error-meta">Erreur 404 · page introuvable</div>
          </div>
        </div>
      </body>
    </html>
  )
}
