import { render, screen } from '@/lib/test-utils'
import { vi } from 'vitest'
import { Footer } from './footer'

// Mock next-intl locale hooks
vi.mock('next-intl', async () => {
  const actual = await vi.importActual('next-intl')
  return {
    ...actual,
    useLocale: vi.fn(() => 'en'),
  }
})

describe('Footer', () => {
  it('renders legal links with correct hrefs', () => {
    render(<Footer />)

    const termsLink = screen.getByRole('link', { name: /terms/i })
    const privacyLink = screen.getByRole('link', { name: /privacy/i })

    expect(termsLink).toBeInTheDocument()
    expect(termsLink).toHaveAttribute('href', '/legal/terms')

    expect(privacyLink).toBeInTheDocument()
    expect(privacyLink).toHaveAttribute('href', '/legal/privacy')
  })

  it('renders all navigation links', () => {
    render(<Footer />)

    expect(screen.getByRole('link', { name: /clubs/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /events/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /calendar/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /terms/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /privacy/i })).toBeInTheDocument()
  })

  it('renders navigation links with correct hrefs', () => {
    render(<Footer />)

    expect(screen.getByRole('link', { name: /clubs/i })).toHaveAttribute(
      'href',
      '/clubs'
    )
    expect(screen.getByRole('link', { name: /events/i })).toHaveAttribute(
      'href',
      '/events'
    )
    expect(screen.getByRole('link', { name: /calendar/i })).toHaveAttribute(
      'href',
      '/calendar'
    )
  })

  it('renders language toggle', () => {
    render(<Footer />)

    // When locale is 'en', should show French link
    expect(screen.getByRole('link', { name: /français/i })).toBeInTheDocument()
  })

  it('renders logo and tagline', () => {
    render(<Footer />)

    expect(
      screen.getByText(/Running Community in Quebec City/i)
    ).toBeInTheDocument()
    expect(screen.getByText('.run')).toBeInTheDocument()
  })

  it('renders copyright with current year', () => {
    render(<Footer />)

    const year = new Date().getFullYear()
    expect(screen.getByText(`© ${year} quebec.run`)).toBeInTheDocument()
  })
})
