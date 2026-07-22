import type { Metadata } from 'next'

export const SITE_URL = 'https://www.quebec.run'
export const SITE_NAME = 'quebec.run'
export const DEFAULT_OG_IMAGE = `${SITE_URL}/opengraph-image`

export type Locale = 'fr' | 'en'

export type BuildPageMetadataInput = {
  locale: Locale
  /** Path WITHOUT the locale prefix. Use '' for the locale root, '/clubs', '/clubs/fauxmouvement', etc. */
  path: string
  title: string
  description: string
  /** Override the default OG image. */
  ogImage?: string
  /** Mark the page as noindex (e.g. admin). Default: indexable. */
  noIndex?: boolean
  /** Override OpenGraph type. Default 'website'; use 'article' or 'event' on detail pages. */
  ogType?: 'website' | 'article'
}

/**
 * Build a Next.js Metadata object with canonical, hreflang alternates,
 * Open Graph, and Twitter card data. Canonical is always self-referencing
 * (same locale + path). Hreflang advertises both fr-CA and en-CA, with
 * fr-CA as x-default since the audience is Quebec.
 */
export function buildPageMetadata({
  locale,
  path,
  title,
  description,
  ogImage = DEFAULT_OG_IMAGE,
  noIndex = false,
  ogType = 'website',
}: BuildPageMetadataInput): Metadata {
  const normalized = normalizePath(path)
  const canonical = `${SITE_URL}/${locale}${normalized}`
  const frUrl = `${SITE_URL}/fr${normalized}`
  const enUrl = `${SITE_URL}/en${normalized}`

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        'fr-CA': frUrl,
        'en-CA': enUrl,
        'x-default': frUrl,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: locale === 'fr' ? 'fr_CA' : 'en_CA',
      type: ogType,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    ...(noIndex && {
      robots: { index: false, follow: false },
    }),
  }
}

function normalizePath(path: string): string {
  if (!path || path === '/') return ''
  return path.startsWith('/') ? path : `/${path}`
}
