import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { revalidatePath, revalidateTag, cachedResults } = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  cachedResults: new Map<string, Promise<unknown>>(),
}))

vi.mock('next/cache', () => ({
  revalidatePath,
  revalidateTag,
  unstable_cache:
    (callback: (...args: unknown[]) => Promise<unknown>, keys: string[]) =>
    (...args: unknown[]) => {
      const key = JSON.stringify([keys, args])
      if (!cachedResults.has(key)) cachedResults.set(key, callback(...args))
      return cachedResults.get(key)
    },
}))

import { cachePublicData, invalidatePublicCache } from './public-cache'

afterEach(() => {
  cachedResults.clear()
  vi.unstubAllEnvs()
})

it('reuses data within a release and refreshes it after a deployment', async () => {
  vi.stubEnv('NODE_ENV', 'production')
  vi.stubEnv('VERCEL_GIT_COMMIT_SHA', 'before-migration')
  let weekday = 'Tuesday'
  const readSchedule = vi.fn(async () => weekday)
  const before = cachePublicData(readSchedule, ['schedule'], {})

  expect(await before()).toBe('Tuesday')
  weekday = 'Wednesday'
  expect(await before()).toBe('Tuesday')

  vi.stubEnv('VERCEL_GIT_COMMIT_SHA', 'after-migration')
  const after = cachePublicData(readSchedule, ['schedule'], {})
  expect(await after()).toBe('Wednesday')
  expect(await after()).toBe('Wednesday')
  expect(readSchedule.mock.calls).toHaveLength(2)
})

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
