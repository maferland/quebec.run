import { render, screen } from '@/lib/test-utils'
import userEvent from '@testing-library/user-event'
import { useSession } from 'next-auth/react'
import { vi, type MockedFunction } from 'vitest'
import { MobileMenu } from './mobile-menu'

vi.mock('next-auth/react')
const mockUseSession = useSession as MockedFunction<typeof useSession>

describe('MobileMenu', () => {
  beforeEach(() => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: vi.fn(),
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders hamburger menu button', () => {
    render(<MobileMenu />)

    const menuButton = screen.getByRole('button', { name: /open menu/i })
    expect(menuButton).toBeInTheDocument()
  })

  it('opens menu when hamburger button is clicked', async () => {
    const user = userEvent.setup()
    render(<MobileMenu />)

    const menuButton = screen.getByRole('button', { name: /open menu/i })
    await user.click(menuButton)

    expect(
      screen.getByRole('button', { name: /close menu/i })
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /clubs/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /events/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('closes menu when X button is clicked', async () => {
    const user = userEvent.setup()
    render(<MobileMenu />)

    const menuButton = screen.getByRole('button', { name: /open menu/i })
    await user.click(menuButton)

    const closeButton = screen.getByRole('button', { name: /close menu/i })
    await user.click(closeButton)

    expect(
      screen.queryByRole('link', { name: /clubs/i })
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('link', { name: /events/i })
    ).not.toBeInTheDocument()
  })

  it('closes menu when backdrop is clicked', async () => {
    const user = userEvent.setup()
    render(<MobileMenu />)

    const menuButton = screen.getByRole('button', { name: /open menu/i })
    await user.click(menuButton)

    // Click backdrop
    const backdrop = document.querySelector('.fixed.inset-0') as HTMLElement
    await user.click(backdrop)

    expect(
      screen.queryByRole('link', { name: /clubs/i })
    ).not.toBeInTheDocument()
  })

  it('shows admin link for admin users', async () => {
    const user = userEvent.setup()
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          email: 'admin@example.com',
          name: 'Admin User',
          isStaff: true,
        },
        expires: '2024-01-01',
      },
      status: 'authenticated',
      update: vi.fn(),
    })

    render(<MobileMenu />)

    const menuButton = screen.getByRole('button', { name: /open menu/i })
    await user.click(menuButton)

    expect(screen.getByRole('link', { name: /admin/i })).toBeInTheDocument()
  })

  it('does not show admin link for non-admin users', async () => {
    const user = userEvent.setup()
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: '1',
          email: 'user@example.com',
          name: 'Regular User',
          isStaff: false,
        },
        expires: '2024-01-01',
      },
      status: 'authenticated',
      update: vi.fn(),
    })

    render(<MobileMenu />)

    const menuButton = screen.getByRole('button', { name: /open menu/i })
    await user.click(menuButton)

    expect(
      screen.queryByRole('link', { name: /admin/i })
    ).not.toBeInTheDocument()
  })
})
