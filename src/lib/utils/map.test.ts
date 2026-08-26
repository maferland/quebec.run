import { afterEach, describe, expect, it, vi } from 'vitest'

async function loadTileUrls() {
  vi.resetModules()
  const { TILE_URLS } = await import('./map')
  return TILE_URLS
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('TILE_URLS', () => {
  it('appends the CARTO key to every basemap style', async () => {
    vi.stubEnv('NEXT_PUBLIC_CARTO_KEY', 'test-key')
    const urls = await loadTileUrls()

    expect(urls.dark).toContain('?key=test-key')
    expect(urls.light).toContain('?key=test-key')
    expect(urls.positron).toContain('?key=test-key')
  })

  it('falls back to keyless URLs when the key is unset', async () => {
    vi.stubEnv('NEXT_PUBLIC_CARTO_KEY', '')
    const urls = await loadTileUrls()

    expect(urls.dark).not.toContain('key=')
    expect(urls.dark).toBe(
      'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
    )
  })

  it('keeps the Leaflet template placeholders intact', async () => {
    vi.stubEnv('NEXT_PUBLIC_CARTO_KEY', 'test-key')
    const urls = await loadTileUrls()

    expect(urls.light).toContain('{z}/{x}/{y}')
    expect(urls.positron).toContain('{s}.basemaps.cartocdn.com')
    expect(urls.positron).toContain('{r}')
  })
})
