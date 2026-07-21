import { beforeEach, describe, expect, it, vi } from 'vitest'

const { revalidatePath, revalidateTag } = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath,
  revalidateTag,
  unstable_cache: vi.fn(),
}))

import { invalidatePublicCache } from './public-cache'

describe('invalidatePublicCache', () => {
  beforeEach(() => {
    revalidateTag.mockReset()
    revalidatePath.mockReset()
    vi.unstubAllEnvs()
  })

  it('revalidates the sitemap route and deduplicates tags', () => {
    vi.stubEnv('NODE_ENV', 'production')

    invalidatePublicCache('public:sitemap', 'public:runs', 'public:runs')

    expect(revalidatePath).toHaveBeenCalledWith('/sitemap.xml')
    expect(revalidateTag).toHaveBeenCalledOnce()
    expect(revalidateTag).toHaveBeenCalledWith('public:runs')
  })

  it('invalidates each supplied tag outside tests', () => {
    vi.stubEnv('NODE_ENV', 'production')

    invalidatePublicCache('public:runs', 'public:clubs')

    expect(revalidateTag).toHaveBeenCalledWith('public:runs')
    expect(revalidateTag).toHaveBeenCalledWith('public:clubs')
  })

  it('does not call the Next cache API in tests', () => {
    vi.stubEnv('NODE_ENV', 'test')

    invalidatePublicCache('public:runs')

    expect(revalidateTag).not.toHaveBeenCalled()
    expect(revalidatePath).not.toHaveBeenCalled()
  })
})
