import { render, screen } from '@/lib/test-utils'
import { useSession } from 'next-auth/react'
import { vi, type MockedFunction } from 'vitest'
import { Header } from './header'

// Mock next-auth
vi.mock('next-auth/react')
const mockUseSession = useSession as MockedFunction<typeof useSession>

// Mock Next.js Link
vi.mock('next/link', () => {
  return {
    default: function MockLink({
      children,
      href,
    }: {
      children: React.ReactNode
      href: string
    }) {
      return <a href={href}>{children}</a>
    },
  }
})

describe('Header', () => {
  beforeEach(() => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: vi.fn(),
    })
  })

  it('renders the logo and navigation links', () => {
    render(<Header />)

    expect(screen.getByText('Clubs')).toBeInTheDocument()
    expect(screen.getByText('Events')).toBeInTheDocument()
  })

  it('shows sign in button when not authenticated', () => {
    render(<Header />)

    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Sign Out' })
    ).not.toBeInTheDocument()
  })

  it('shows loading state', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
      update: vi.fn(),
    })

    render(<Header />)

    // Look for the loading div by its animation
    const loadingDiv = document.querySelector('.animate-pulse')
    expect(loadingDiv).toBeInTheDocument()
  })

  it('shows user info and sign out when authenticated', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          isStaff: false,
        },
        expires: '2025-01-01',
      },
      status: 'authenticated',
      update: vi.fn(),
    })

    render(<Header />)

    // User dropdown should be present (contains user info)
    expect(screen.getByRole('button', { name: /john/i })).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Sign In' })
    ).not.toBeInTheDocument()
  })

  it('shows admin link for admin users', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          name: 'Admin User',
          email: 'admin@example.com',
          isStaff: true,
        },
        expires: '2025-01-01',
      },
      status: 'authenticated',
      update: vi.fn(),
    })

    render(<Header />)

    // Check for admin link in navigation
    expect(screen.getByRole('link', { name: /admin/i })).toBeInTheDocument()
  })

  it('does not show admin link for regular users', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          name: 'Regular User',
          email: 'user@example.com',
          isStaff: false,
        },
        expires: '2025-01-01',
      },
      status: 'authenticated',
      update: vi.fn(),
    })

    render(<Header />)

    expect(
      screen.queryByRole('link', { name: /admin/i })
    ).not.toBeInTheDocument()
  })
})
