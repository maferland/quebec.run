import { describe, it, expect } from 'vitest'
import { authOptions } from './auth'
import { env } from './env'

describe('authOptions', () => {
  it('includes credentials provider in non-production environments', () => {
    // Tests run in test/development mode, so credentials provider should exist
    if (env.NODE_ENV !== 'production') {
      const providers = authOptions.providers as unknown as Array<{
        type?: string
      }>
      const hasCredentials = providers.some((p) => p.type === 'credentials')

      expect(hasCredentials).toBe(true)
      // Verify we have more than just the email provider
      expect(providers.length).toBeGreaterThan(1)
    }
  })

  it('credentials provider has correct configuration', () => {
    if (env.NODE_ENV !== 'production') {
      const providers = authOptions.providers as unknown as Array<{
        id?: string
        type?: string
        options?: Record<string, unknown>
      }>
      const credProvider = providers.find((p) => p.id === 'credentials')

      expect(credProvider).toBeDefined()
      expect(credProvider).toHaveProperty('type', 'credentials')
      expect(credProvider?.options).toHaveProperty('id', 'dev-bypass')
      expect(credProvider?.options).toHaveProperty('name', 'Dev Bypass')
    }
  })
})
