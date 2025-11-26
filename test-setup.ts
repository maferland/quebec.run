import '@testing-library/jest-dom'
import React from 'react'
import { vi } from 'vitest'
import { setupTestDatabase } from './src/lib/test-seed'

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
