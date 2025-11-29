import '@testing-library/jest-dom'
import React from 'react'
import { vi } from 'vitest'
import { setupTestDatabase } from './src/lib/test-seed'

// Polyfill Web APIs for jsdom environment
// Node 18+ has these built-in, but jsdom doesn't expose them
if (typeof global.Request === 'undefined') {
  // @ts-expect-error - node:fetch exists in Node 18+ but types not in @types/node yet
  const nodeFetch = await import('node:fetch')
  global.Request = nodeFetch.Request as typeof global.Request
  global.Response = nodeFetch.Response as typeof global.Response
  global.Headers = nodeFetch.Headers as typeof global.Headers
  global.fetch = nodeFetch.fetch as typeof global.fetch
}

// Make vi available globally
;(globalThis as typeof globalThis & { vi: typeof vi }).vi = vi

// Setup test database with migrations before all tests
await setupTestDatabase()

// Mock NextAuth to avoid URL parsing issues in tests
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({ data: null, status: 'loading' })),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  signIn: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(),
}))

// Mock Next.js fonts
vi.mock('next/font/google', () => ({
  Geist: vi.fn(() => ({
    variable: '--font-geist-sans',
    className: 'font-geist-sans',
  })),
  Geist_Mono: vi.fn(() => ({
    variable: '--font-geist-mono',
    className: 'font-geist-mono',
  })),
  Montserrat: vi.fn(() => ({
    variable: '--font-heading',
    className: 'font-heading',
  })),
  Inter: vi.fn(() => ({
    variable: '--font-body',
    className: 'font-body',
  })),
}))

// Mock next-intl navigation
vi.mock('@/i18n/navigation', () => ({
  Link: ({
    href,
    children,
    ...props
  }: {
    href: string
    children: React.ReactNode
    [key: string]: unknown
  }) => React.createElement('a', { href, ...props }, children),
  redirect: vi.fn(),
  usePathname: vi.fn(() => '/'),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  })),
  getPathname: vi.fn(() => '/'),
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  })),
  useSearchParams: vi.fn(() => ({
    get: vi.fn(),
  })),
  usePathname: vi.fn(() => '/'),
}))
