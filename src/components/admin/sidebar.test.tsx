import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/lib/test-utils'
import { AdminSidebar } from './sidebar'

// Mock next/navigation
const mockPathname = vi.fn(() => '/admin')
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}))

// Mock @/i18n/navigation
vi.mock('@/i18n/navigation', () => ({
  Link: function MockLink({
    children,
    href,
    className,
  }: {
    children: React.ReactNode
    href: string
    className?: string
  }) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    )
  },
}))

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      dashboard: 'Dashboard',
      clubs: 'Clubs',
      events: 'Events',
      settings: 'Settings',
    }
    return translations[key] || key
  },
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}))

describe('AdminSidebar', () => {
  it('renders admin header', () => {
    render(<AdminSidebar />)

    expect(screen.getByText('Admin')).toBeInTheDocument()
    expect(screen.getByText('Management Dashboard')).toBeInTheDocument()
  })

  it('renders all navigation links', () => {
    render(<AdminSidebar />)

    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /clubs/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /events/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument()
  })

  it('renders back to site link', () => {
    render(<AdminSidebar />)

    expect(
      screen.getByRole('link', { name: /back to site/i })
    ).toBeInTheDocument()
  })

  it('highlights active dashboard link', () => {
    mockPathname.mockReturnValue('/admin')

    render(<AdminSidebar />)

    const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
    expect(dashboardLink).toHaveClass('bg-primary', 'text-text-inverse')
  })

  it('highlights active clubs link', () => {
    mockPathname.mockReturnValue('/admin/clubs')

    render(<AdminSidebar />)

    const clubsLink = screen.getByRole('link', { name: /clubs/i })
    expect(clubsLink).toHaveClass('bg-primary', 'text-text-inverse')
  })

  it('highlights clubs link when on clubs sub-route', () => {
    mockPathname.mockReturnValue('/admin/clubs/new')

    render(<AdminSidebar />)

    const clubsLink = screen.getByRole('link', { name: /clubs/i })
    expect(clubsLink).toHaveClass('bg-primary', 'text-text-inverse')
  })

  it('highlights active events link', () => {
    mockPathname.mockReturnValue('/admin/events')

    render(<AdminSidebar />)

    const eventsLink = screen.getByRole('link', { name: /events/i })
    expect(eventsLink).toHaveClass('bg-primary', 'text-text-inverse')
  })

  it('highlights active settings link', () => {
    mockPathname.mockReturnValue('/admin/settings')

    render(<AdminSidebar />)

    const settingsLink = screen.getByRole('link', { name: /settings/i })
    expect(settingsLink).toHaveClass('bg-primary', 'text-text-inverse')
  })

  it('does not highlight dashboard link on sub-routes', () => {
    mockPathname.mockReturnValue('/admin/clubs')

    render(<AdminSidebar />)

    const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
    expect(dashboardLink).not.toHaveClass('bg-primary', 'text-text-inverse')
    expect(dashboardLink).toHaveClass('text-text-secondary')
  })

  it('has correct href attributes', () => {
    render(<AdminSidebar />)

    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute(
      'href',
      '/admin'
    )
    expect(screen.getByRole('link', { name: /clubs/i })).toHaveAttribute(
      'href',
      '/admin/clubs'
    )
    expect(screen.getByRole('link', { name: /events/i })).toHaveAttribute(
      'href',
      '/admin/events'
    )
    expect(screen.getByRole('link', { name: /settings/i })).toHaveAttribute(
      'href',
      '/admin/settings'
    )
    expect(screen.getByRole('link', { name: /back to site/i })).toHaveAttribute(
      'href',
      '/'
    )
  })

  describe('Accessibility', () => {
    it('uses semantic nav element', () => {
      const { container } = render(<AdminSidebar />)

      expect(container.querySelector('nav')).toBeInTheDocument()
    })

    it('renders links with proper roles', () => {
      render(<AdminSidebar />)

      const links = screen.getAllByRole('link')
      expect(links.length).toBeGreaterThan(0)
    })

    it('shows icons with navigation links', () => {
      const { container } = render(<AdminSidebar />)

      // Each navigation link should have an icon (svg element)
      const navLinks = container.querySelectorAll('nav a')
      navLinks.forEach((link) => {
        const icon = link.querySelector('svg')
        expect(icon).toBeInTheDocument()
      })
    })
  })
})
