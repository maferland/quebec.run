import { render, screen } from '@/lib/test-utils'
import { useSession } from 'next-auth/react'
import { vi, type MockedFunction } from 'vitest'
import { Navigation } from './navigation'

const mockUseSession = useSession as MockedFunction<typeof useSession>

describe('Navigation', () => {
  beforeEach(() => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: vi.fn(),
    })
  })

  it('renders navigation links for desktop', () => {
    render(<Navigation />)

    expect(screen.getByText('Clubs')).toBeInTheDocument()
    expect(screen.getByText('Events')).toBeInTheDocument()
  })

  it('renders mobile menu button', () => {
    render(<Navigation />)

    expect(
      screen.getByRole('button', { name: /open menu/i })
    ).toBeInTheDocument()
  })

  it('shows user dropdown when authenticated', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          name: 'Jane Doe',
          email: 'jane@example.com',
          isStaff: false,
        },
        expires: '2025-01-01',
      },
      status: 'authenticated',
      update: vi.fn(),
    })

    render(<Navigation />)

    expect(screen.getByRole('button', { name: /jane/i })).toBeInTheDocument()
  })

  it('does not show user dropdown when unauthenticated', () => {
    render(<Navigation />)

    expect(
      screen.queryByRole('button', { name: /jane/i })
    ).not.toBeInTheDocument()
  })
})
