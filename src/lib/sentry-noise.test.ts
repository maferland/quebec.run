import { describe, expect, it } from 'vitest'
import type { ErrorEvent as SentryErrorEvent } from '@sentry/nextjs'
import { dropDomEventNoise } from './sentry-noise'

const event = { event_id: 'abc' } as SentryErrorEvent

describe('dropDomEventNoise', () => {
  it.each([
    ['a bare resource-load Event', new Event('error')],
    ['an ErrorEvent subclass', new ErrorEvent('error', { message: 'boom' })],
  ])('drops %s', (_case, originalException) => {
    expect(dropDomEventNoise(event, { originalException })).toBeNull()
  })

  it.each([
    ['a real Error', new TypeError('e is not iterable')],
    ['a string rejection reason', 'plain string reason'],
    ['a hint with no originalException', undefined],
  ])('keeps %s', (_case, originalException) => {
    expect(dropDomEventNoise(event, { originalException })).toBe(event)
  })
})
