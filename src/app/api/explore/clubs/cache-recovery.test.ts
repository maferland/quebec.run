// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest'
import ResponseCache, {
  type CachedRouteKind,
  type ResponseGenerator,
  type IncrementalResponseCache,
  type IncrementalResponseCacheEntry,
} from 'next/dist/server/response-cache'
import type { RouteKind } from 'next/dist/server/route-kind'
import { getClubsForExplore } from '@/lib/services/clubs'
import { GET } from './route'

vi.mock('@/lib/services/clubs', () => ({ getClubsForExplore: vi.fn() }))
beforeEach(() => vi.mocked(getClubsForExplore).mockReset())

function cachedRoute() {
  const entries = new Map<string, IncrementalResponseCacheEntry>()
  const incrementalCache: IncrementalResponseCache = {
    get: async (key) => entries.get(key) ?? null,
    set: async (key, value, context) => {
      entries.set(key, {
        value,
        cacheControl: context.cacheControl,
        isStale: false,
      })
    },
  }
  const cache = new ResponseCache(false)
  const generate: ResponseGenerator = async () => {
    // Same boundary as Next's static app-route response generator: only a
    // completed handler Response becomes a persistent response-cache entry.
    const response = await GET()
    return {
      value: {
        kind: 'APP_ROUTE' as CachedRouteKind.APP_ROUTE,
        status: response.status,
        body: Buffer.from(await response.arrayBuffer()),
        headers: {},
      },
      cacheControl: { revalidate: false, expire: undefined },
    }
  }
  const read = (isOnDemandRevalidate = false) =>
    cache.get('/api/explore/clubs', generate, {
      incrementalCache,
      routeKind: 'APP_ROUTE' as RouteKind.APP_ROUTE,
      isOnDemandRevalidate,
    })
  return { read, entries }
}

it('does not persist a failed cold read and caches the successful recovery', async () => {
  const error = new Error('database down')
  vi.mocked(getClubsForExplore)
    .mockRejectedValueOnce(error)
    .mockResolvedValue([])
  const { read, entries } = cachedRoute()
  await expect(read()).rejects.toBe(error)
  expect(entries.size).toBe(0)
  expect((await read())?.value).toMatchObject({ status: 200 })
  await new Promise<void>((resolve) => setImmediate(resolve))
  expect((await read())?.value).toMatchObject({ status: 200 })
  expect(getClubsForExplore).toHaveBeenCalledTimes(2)
})

it('preserves the previous successful cache entry when revalidation fails', async () => {
  vi.mocked(getClubsForExplore).mockResolvedValueOnce([])
  const { read, entries } = cachedRoute()
  expect((await read())?.value).toMatchObject({ status: 200 })
  await new Promise<void>((resolve) => setImmediate(resolve))
  const error = new Error('temporary outage during revalidation')
  vi.mocked(getClubsForExplore).mockRejectedValueOnce(error)
  await expect(read(true)).rejects.toBe(error)
  expect(entries.get('/api/explore/clubs')?.value).toMatchObject({
    status: 200,
  })
})
