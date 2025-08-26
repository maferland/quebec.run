import { describe, expect, it } from 'vitest'
import { withPublic, withAuth } from './api-middleware'
import { z } from 'zod'

const testSchema = z.object({
  name: z.string().min(1),
  age: z.number().optional(),
})

describe('api-middleware', () => {
  describe('withPublic', () => {
    it('validates and processes valid JSON request data', async () => {
      const handler = withPublic(testSchema)((data) => {
        return Response.json({ received: data })
      })

      const request = new Request('http://localhost/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test', age: 25 }),
      })

      const response = await handler(request, { params: Promise.resolve({}) })
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.received).toEqual({ name: 'Test', age: 25 })
    })

    it('validates and processes query parameters', async () => {
      const querySchema = z.object({
        search: z.string().optional(),
        limit: z.coerce.number().default(10),
      })

      const handler = withPublic(querySchema)((data) => {
        return Response.json({ query: data })
      })

      const request = new Request('http://localhost/test?search=test&limit=5')

      const response = await handler(request, { params: Promise.resolve({}) })
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.query).toEqual({ search: 'test', limit: 5 })
    })

    it('returns 400 for invalid data', async () => {
      const handler = withPublic(testSchema)((data) => {
        return Response.json({ received: data })
      })

      const request = new Request('http://localhost/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ age: 25 }), // missing required 'name'
      })

      const response = await handler(request, { params: Promise.resolve({}) })
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toContain('Validation')
    })

    it('catches handler errors and returns 500', async () => {
      const handler = withPublic(testSchema)(() => {
        throw new Error('Handler error')
      })

      const request = new Request('http://localhost/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test' }),
      })

      const response = await handler(request, { params: Promise.resolve({}) })
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.error).toBe('Handler error')
    })
  })

  describe('withAuth', () => {
    it('returns 401 when no session is present', async () => {
      const handler = withAuth(testSchema)(({ user, data }) => {
        return Response.json({ user: user.id, data })
      })

      const request = new Request('http://localhost/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test' }),
      })

      const response = await handler(request, { params: Promise.resolve({}) })
      const result = await response.json()

      expect(response.status).toBe(401)
      expect(result.error).toBe('Authentication required')
    })
  })
})
