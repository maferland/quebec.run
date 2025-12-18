import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/lib/test-utils'
import { userEvent } from '@testing-library/user-event'
import { useSession } from 'next-auth/react'
import { http, HttpResponse } from 'msw'
import { setupMSW } from '@/lib/test-msw-setup'
import { server } from '@/lib/test-msw'
import { ConsentBannerWrapper } from './consent-banner-wrapper'
import type { MockedFunction } from 'vitest'

const mockUseSession = useSession as MockedFunction<typeof useSession>

vi.mock('./consent-banner', () => ({
  ConsentBanner: ({ onAccept }: { onAccept: () => void }) => (
    <div data-testid="consent-banner">
      <button onClick={onAccept}>Accept Terms</button>
    </div>
  ),
}))

describe('ConsentBannerWrapper', () => {
  setupMSW()

  beforeEach(() => {
    vi.clearAllMocks()
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
    server.use(
      http.get('/api/user/consent', () => {
        return HttpResponse.json({ hasConsent: true })
      })
    )

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

    render(<ConsentBannerWrapper />)

    await waitFor(() => {
      expect(screen.queryByTestId('consent-banner')).not.toBeInTheDocument()
    })
  })

  it('renders banner when authenticated and no consent', async () => {
    server.use(
      http.get('/api/user/consent', () => {
        return HttpResponse.json({ hasConsent: false })
      })
    )

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

    render(<ConsentBannerWrapper />)

    await waitFor(() => {
      expect(screen.getByTestId('consent-banner')).toBeInTheDocument()
    })
  })

  it('calls mutation on accept', async () => {
    let hasConsent = false

    server.use(
      http.get('/api/user/consent', () => {
        return HttpResponse.json({ hasConsent })
      }),
      http.post('/api/user/consent', () => {
        hasConsent = true
        return HttpResponse.json({ success: true, consentId: 'test-id' })
      })
    )

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

    render(<ConsentBannerWrapper />)

    await waitFor(() => {
      expect(screen.getByTestId('consent-banner')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /accept/i }))

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

    expect(screen.queryByTestId('consent-banner')).not.toBeInTheDocument()
  })
})
