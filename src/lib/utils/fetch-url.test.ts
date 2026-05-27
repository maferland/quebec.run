import { describe, test, expect } from 'vitest'
import { buildFetchUrl } from './fetch-url'

describe('buildFetchUrl', () => {
  test('returns base when no params', () => {
    expect(buildFetchUrl('/api/x', {})).toBe('/api/x')
  })

  test('skips null/undefined/empty', () => {
    expect(
      buildFetchUrl('/api/x', { a: null, b: undefined, c: '', d: 'y' })
    ).toBe('/api/x?d=y')
  })

  test('serializes numbers and booleans', () => {
    expect(buildFetchUrl('/api/x', { limit: 10, active: true })).toBe(
      '/api/x?limit=10&active=true'
    )
  })

  test('preserves zero', () => {
    expect(buildFetchUrl('/api/x', { offset: 0 })).toBe('/api/x?offset=0')
  })
})
