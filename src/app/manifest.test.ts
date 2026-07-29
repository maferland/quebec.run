import manifest from './manifest'

describe('manifest', () => {
  it('starts the installed app on the default locale', () => {
    expect(manifest().start_url).toBe('/fr')
  })

  it('offers every icon size as maskable so Android does not letterbox it', () => {
    const icons = manifest().icons ?? []
    const maskable = icons.filter((icon) => icon.purpose === 'maskable')

    expect(maskable.map((icon) => icon.sizes)).toEqual(['192x192', '512x512'])
    expect(icons.filter((icon) => icon.purpose === 'any')).toHaveLength(2)
  })
})
