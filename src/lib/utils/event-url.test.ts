import { describe, expect, it } from 'vitest'
import { eventUrl } from './event-url'

describe('eventUrl', () => {
  it.each([
    {
      name: 'virtual occurrence',
      event: {
        id: '6am-club-limoilou--2026-08-07',
        recurringSlug: 'limoilou',
        club: { slug: '6am-club' },
      },
      expected: '/clubs/6am-club/events/limoilou/2026-08-07',
    },
    {
      name: 'slugged one-off',
      event: { id: 'cmshoyjfb0000kqkwsd82919y', slug: '6pm-run-upika' },
      expected: '/run/6pm-run-upika',
    },
    {
      name: 'one-off with no slug',
      event: { id: 'cmshoyjfb0000kqkwsd82919y' },
      expected: '/events/cmshoyjfb0000kqkwsd82919y',
    },
    {
      name: 'dated id with no recurring slug',
      event: { id: 'orphan--2026-08-07', club: { slug: '6am-club' } },
      expected: '/events/orphan--2026-08-07',
    },
  ])('builds the $name URL', ({ event, expected }) => {
    expect(eventUrl(event)).toBe(expected)
  })
})
