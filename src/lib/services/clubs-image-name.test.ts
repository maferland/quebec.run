import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { findUnique, unstableCache } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  unstableCache: vi.fn((callback: (...args: unknown[]) => unknown) => callback),
}))

vi.mock('@/lib/prisma', () => ({ prisma: { club: { findUnique } } }))
vi.mock('next/cache', () => ({
  unstable_cache: unstableCache,
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}))

import { getClubImageName } from './clubs'

describe('getClubImageName', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('NODE_ENV', 'production')
  })

  afterEach(() => vi.unstubAllEnvs())

  it('reads only the image name without scheduled expiry and with only its club invalidation tag', async () => {
    findUnique.mockResolvedValue({ name: 'Faux Mouvement' })

    expect(await getClubImageName({ slug: 'fauxmouvement' })).toEqual({
      name: 'Faux Mouvement',
    })
    expect(findUnique).toHaveBeenCalledExactlyOnceWith({
      where: { slug: 'fauxmouvement' },
      select: { name: true },
    })
    expect(unstableCache).toHaveBeenCalledWith(
      expect.any(Function),
      expect.arrayContaining(['club-image-name', 'fauxmouvement']),
      {
        revalidate: false,
        tags: ['public:club-image:fauxmouvement'],
      }
    )
  })

  it('returns null for an unknown slug', async () => {
    findUnique.mockResolvedValue(null)
    expect(await getClubImageName({ slug: 'missing-club' })).toBeNull()
  })

  it('propagates database errors instead of inventing a club', async () => {
    findUnique.mockRejectedValue(new Error('database unavailable'))
    await expect(getClubImageName({ slug: 'fauxmouvement' })).rejects.toThrow(
      'database unavailable'
    )
  })
})
