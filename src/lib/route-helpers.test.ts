import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { getQueryParams } from './route-helpers'

describe('route-helpers', () => {
  describe('getQueryParams', () => {
    it('extracts query parameters from URL', () => {
      const request = new NextRequest(
        'http://localhost/test?name=John&age=25&active=true'
      )
      const params = getQueryParams(request)

      expect(params).toEqual({
        name: 'John',
        age: '25',
        active: 'true',
      })
    })

    it('returns empty object when no query parameters', () => {
      const request = new NextRequest('http://localhost/test')
      const params = getQueryParams(request)

      expect(params).toEqual({})
    })

    it('handles URL encoding correctly', () => {
      const request = new NextRequest(
        'http://localhost/test?name=John%20Doe&city=Qu%C3%A9bec'
      )
      const params = getQueryParams(request)

      expect(params).toEqual({
        name: 'John Doe',
        city: 'Québec',
      })
    })

    it('handles multiple values for same parameter', () => {
      const request = new NextRequest(
        'http://localhost/test?tag=running&tag=fitness'
      )
      const params = getQueryParams(request)

      // Should get the last value when multiple values for same key
      expect(params.tag).toBe('fitness')
    })
  })
})
