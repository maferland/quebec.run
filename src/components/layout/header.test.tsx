import { render, screen } from '@/lib/test-utils'
import { useSession } from 'next-auth/react'
import { Header } from './header'

// Mock next-auth
vi.mock('next-auth/react')
const mockUseSession = useSession as vi.MockedFunction<typeof useSession>

// Mock Next.js Link
vi.mock('next/link', () => {
  return {
    default: function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
      return <a href={href}>{children}</a>
    }
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
    
    expect(screen.getByText('Courses')).toBeInTheDocument()
    expect(screen.getByText('Map')).toBeInTheDocument()
    expect(screen.getByText('Calendar')).toBeInTheDocument()
  })

  it('shows sign in button when not authenticated', () => {
    render(<Header />)
    
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Sign Out' })).not.toBeInTheDocument()
  })

  it('shows loading state', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
      update: vi.fn(),
    })

    render(<Header />)
    
    // Look for the loading div by its specific classes
    const loadingDiv = document.querySelector('.animate-pulse')
    expect(loadingDiv).toBeInTheDocument()
    expect(loadingDiv).toHaveClass('w-8', 'h-8', 'bg-gray-200', 'rounded')
  })

  it('shows user info and sign out when authenticated', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          name: 'John Doe',
          email: 'john@example.com',
          isAdmin: false,
        },
        expires: '2025-01-01',
      },
      status: 'authenticated',
      update: vi.fn(),
    })

    render(<Header />)
    
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign Out' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Sign In' })).not.toBeInTheDocument()
  })

  it('shows admin link for admin users', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          name: 'Admin User',
          email: 'admin@example.com',
          isAdmin: true,
        },
        expires: '2025-01-01',
      },
      status: 'authenticated',
      update: vi.fn(),
    })

    render(<Header />)
    
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('does not show admin link for regular users', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          name: 'Regular User',
          email: 'user@example.com',
          isAdmin: false,
        },
        expires: '2025-01-01',
      },
      status: 'authenticated',
      update: vi.fn(),
    })

    render(<Header />)
    
    expect(screen.queryByText('Admin')).not.toBeInTheDocument()
  })
})