import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/lib/test-utils'
import { userEvent } from '@testing-library/user-event'
import { useSession } from 'next-auth/react'
import { ConsentBannerWrapper } from './consent-banner-wrapper'
import type { MockedFunction } from 'vitest'

// Mock next-auth
vi.mock('next-auth/react')
const mockUseSession = useSession as MockedFunction<typeof useSession>

// Mock ConsentBanner component
vi.mock('./consent-banner', () => ({
  ConsentBanner: ({ onAccept }: { onAccept: () => void }) => (
    <div data-testid="consent-banner">
      <button onClick={onAccept}>Accept Terms</button>
    </div>
  ),
}))

describe('ConsentBannerWrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it('renders nothing when not authenticated', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: vi.fn(),
    })

    render(<ConsentBannerWrapper />)

    expect(screen.queryByTestId('consent-banner')).not.toBeInTheDocument()
  })

  it('renders nothing when consent exists', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
          isStaff: false,
        },
        expires: '2025-01-01',
      },
      status: 'authenticated',
      update: vi.fn(),
    })
    ;(global.fetch as MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ hasConsent: true }),
    } as Response)

    render(<ConsentBannerWrapper />)

    // Wait for the API call to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/user/consent')
    })

    // Wait for banner to not be in document after data loads
    await waitFor(() => {
      expect(screen.queryByTestId('consent-banner')).not.toBeInTheDocument()
    })
  })

  it('renders banner when authenticated and no consent', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
          isStaff: false,
        },
        expires: '2025-01-01',
      },
      status: 'authenticated',
      update: vi.fn(),
    })
    ;(global.fetch as MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ hasConsent: false }),
    } as Response)

    render(<ConsentBannerWrapper />)

    await waitFor(() => {
      expect(screen.getByTestId('consent-banner')).toBeInTheDocument()
    })
  })

  it('calls mutation on accept', async () => {
    const user = userEvent.setup()
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
          isStaff: false,
        },
        expires: '2025-01-01',
      },
      status: 'authenticated',
      update: vi.fn(),
    })

    const mockFetch = global.fetch as MockedFunction<typeof fetch>
    // First call: GET consent (no consent)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ hasConsent: false }),
    } as Response)

    // Second call: POST consent
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, consentId: 'test-id' }),
    } as Response)

    // Third call: GET consent after mutation (has consent now)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ hasConsent: true }),
    } as Response)

    render(<ConsentBannerWrapper />)

    // Wait for banner to appear
    await waitFor(() => {
      expect(screen.getByTestId('consent-banner')).toBeInTheDocument()
    })

    // Click accept button
    await user.click(screen.getByRole('button', { name: /accept/i }))

    // Verify POST was called
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/user/consent', {
        method: 'POST',
      })
    })

    // Banner should eventually disappear after refetch
    await waitFor(() => {
      expect(screen.queryByTestId('consent-banner')).not.toBeInTheDocument()
    })
  })

  it('does not fetch consent when session is loading', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
      update: vi.fn(),
    })

    render(<ConsentBannerWrapper />)

    expect(global.fetch).not.toHaveBeenCalled()
    expect(screen.queryByTestId('consent-banner')).not.toBeInTheDocument()
  })
})
