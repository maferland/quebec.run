import { describe, it, expect } from 'vitest'
import { buildPageMetadata, SITE_URL } from './metadata'

describe('buildPageMetadata', () => {
  it('sets a self-referential canonical URL for the given locale + path', () => {
    const meta = buildPageMetadata({
      locale: 'fr',
      path: '/clubs',
      title: 'T',
      description: 'D',
    })
    expect(meta.alternates?.canonical).toBe(`${SITE_URL}/fr/clubs`)
  })

  it('treats empty path as the locale root', () => {
    const meta = buildPageMetadata({
      locale: 'en',
      path: '',
      title: 'T',
      description: 'D',
    })
    expect(meta.alternates?.canonical).toBe(`${SITE_URL}/en`)
  })

  it('advertises both fr-CA + en-CA hreflang plus x-default=fr-CA', () => {
    const meta = buildPageMetadata({
      locale: 'fr',
      path: '/clubs/foo',
      title: 'T',
      description: 'D',
    })
    expect(meta.alternates?.languages).toEqual({
      'fr-CA': `${SITE_URL}/fr/clubs/foo`,
      'en-CA': `${SITE_URL}/en/clubs/foo`,
      'x-default': `${SITE_URL}/fr/clubs/foo`,
    })
  })

  it('emits OpenGraph with canonical URL + locale + default image', () => {
    const meta = buildPageMetadata({
      locale: 'fr',
      path: '/clubs',
      title: 'Clubs',
      description: 'D',
    })
    expect(meta.openGraph?.url).toBe(`${SITE_URL}/fr/clubs`)
    expect(meta.openGraph?.locale).toBe('fr_CA')
    expect(meta.openGraph?.images).toHaveLength(1)
  })

  it('omits robots block by default + sets noindex when requested', () => {
    const indexable = buildPageMetadata({
      locale: 'fr',
      path: '/x',
      title: 'T',
      description: 'D',
    })
    expect(indexable.robots).toBeUndefined()

    const hidden = buildPageMetadata({
      locale: 'fr',
      path: '/x',
      title: 'T',
      description: 'D',
      noIndex: true,
    })
    expect(hidden.robots).toEqual({ index: false, follow: false })
  })

  it('passes through ogType for article-style pages', () => {
    const meta = buildPageMetadata({
      locale: 'fr',
      path: '/events/foo',
      title: 'T',
      description: 'D',
      ogType: 'article',
    })
    expect((meta.openGraph as { type?: string }).type).toBe('article')
  })
})
