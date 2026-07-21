import { unstable_cache } from 'next/cache'

export const PUBLIC_PAGE_REVALIDATE_SECONDS = 3600
export const PUBLIC_API_REVALIDATE_SECONDS = 900

export const PUBLIC_CACHE_TAGS = {
  clubs: 'public:clubs',
  runs: 'public:runs',
  sitemap: 'public:sitemap',
} as const

export function publicCacheHeaders(seconds = PUBLIC_API_REVALIDATE_SECONDS) {
  return {
    'Cache-Control': `public, s-maxage=${seconds}, stale-while-revalidate=${seconds * 2}`,
  }
}

type CacheOptions = NonNullable<Parameters<typeof unstable_cache>[2]>

export function cachePublicData<Args extends unknown[], Result>(
  fn: (...args: Args) => Promise<Result>,
  keyParts: string[],
  options: CacheOptions
) {
  if (process.env.NODE_ENV === 'test') return fn
  return unstable_cache(fn, keyParts, options)
}
