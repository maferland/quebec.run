import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Make vi available globally
;(globalThis as any).vi = vi

// Mock NextAuth to avoid URL parsing issues in tests
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({ data: null, status: 'loading' })),
  SessionProvider: ({ children }: any) => children,
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
}))
