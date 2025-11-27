import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@/lib/test-utils'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import type { MockedFunction } from 'vitest'
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import PrivacySettingsPage from './page'

vi.mock('next-auth/react')
vi.mock('next/navigation')

const mockUseSession = useSession as MockedFunction<typeof useSession>
const mockUseRouter = useRouter as MockedFunction<typeof useRouter>
const mockPush = vi.fn()
const mockFetch = vi.fn()

global.fetch = mockFetch

describe('PrivacySettingsPage', () => {
  beforeEach(() => {
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    } as AppRouterInstance)

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ hasPendingRequest: false }),
    } as Response)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Authentication', () => {
    it('shows loading state while checking auth', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
        update: vi.fn(),
      })

      render(<PrivacySettingsPage />)

      const loadingElements = document.querySelectorAll('.animate-pulse')
      expect(loadingElements.length).toBeGreaterThan(0)
    })

    it('redirects to signin when unauthenticated', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: vi.fn(),
      })

      render(<PrivacySettingsPage />)

      expect(mockPush).toHaveBeenCalledWith('/api/auth/signin')
    })

    it('renders content when authenticated', async () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: '1',
            email: 'user@example.com',
            name: 'Test User',
            isAdmin: false,
          },
          expires: '2024-01-01',
        },
        status: 'authenticated',
        update: vi.fn(),
      })

      render(<PrivacySettingsPage />)

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { level: 1, name: /privacy/i })
        ).toBeInTheDocument()
      })
    })
  })

  describe('Export Data', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: '1',
            email: 'user@example.com',
            name: 'Test User',
            isAdmin: false,
          },
          expires: '2024-01-01',
        },
        status: 'authenticated',
        update: vi.fn(),
      })
    })

    it('renders export data button', async () => {
      render(<PrivacySettingsPage />)

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /download my data/i })
        ).toBeInTheDocument()
      })
    })

    it('export button is enabled by default', async () => {
      render(<PrivacySettingsPage />)

      await waitFor(() => {
        const exportButton = screen.getByRole('button', {
          name: /download my data/i,
        })
        expect(exportButton).not.toBeDisabled()
      })
    })
  })

  describe('Delete Account', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: '1',
            email: 'user@example.com',
            name: 'Test User',
            isAdmin: false,
          },
          expires: '2024-01-01',
        },
        status: 'authenticated',
        update: vi.fn(),
      })
    })

    it('renders delete account button', async () => {
      render(<PrivacySettingsPage />)

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /request deletion/i })
        ).toBeInTheDocument()
      })
    })

    it('delete button is enabled by default', async () => {
      render(<PrivacySettingsPage />)

      await waitFor(() => {
        const deleteButton = screen.getByRole('button', {
          name: /request deletion/i,
        })
        expect(deleteButton).not.toBeDisabled()
      })
    })
  })

  describe('Pending Deletion', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: '1',
            email: 'user@example.com',
            name: 'Test User',
            isAdmin: false,
          },
          expires: '2024-01-01',
        },
        status: 'authenticated',
        update: vi.fn(),
      })
    })

    it('displays pending deletion message when request exists', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          hasPendingRequest: true,
          request: {
            id: 'req-123',
            scheduledFor: '2024-12-31T00:00:00Z',
          },
        }),
      } as Response)

      render(<PrivacySettingsPage />)

      await waitFor(() => {
        expect(screen.getByText(/deletion scheduled/i)).toBeInTheDocument()
      })
    })

    it('displays cancel button when deletion is pending', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          hasPendingRequest: true,
          request: {
            id: 'req-123',
            scheduledFor: '2024-12-31T00:00:00Z',
          },
        }),
      } as Response)

      render(<PrivacySettingsPage />)

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /cancel/i })
        ).toBeInTheDocument()
      })
    })
  })
})
