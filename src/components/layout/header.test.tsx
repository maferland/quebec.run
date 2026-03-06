import { render, screen } from '@/lib/test-utils'
import { useSession } from 'next-auth/react'
import { vi, type MockedFunction } from 'vitest'
import { Header } from './header'

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
    expect(screen.getByText('Calendar')).toBeInTheDocument()
  })

  it('shows sign in button when unauthenticated', () => {
    render(<Header />)

    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows mobile menu hamburger button', () => {
    render(<Header />)

    expect(
      screen.getByRole('button', { name: /open menu/i })
    ).toBeInTheDocument()
  })

  it('shows user name when authenticated', () => {
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

    expect(screen.getByText('John')).toBeInTheDocument()
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
