import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { ConsentBanner } from './consent-banner'

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => {
    const t = (key: string) => key
    t.rich = (key: string, values?: Record<string, (chunks: React.ReactNode) => React.ReactNode>) => {
      if (values && key === 'message') {
        return (
          <>
            {values.termsLink?.('terms')}
            {' '}
            {values.privacyLink?.('privacy')}
          </>
        )
      }
      return key
    }
    return t
  },
}))

// Mock navigation
vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

describe('ConsentBanner', () => {
  it('renders with accept button', () => {
    render(<ConsentBanner onAccept={() => {}} />)

    expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument()
  })

  it('calls onAccept when button clicked', async () => {
    const user = userEvent.setup()
    const onAccept = vi.fn()

    render(<ConsentBanner onAccept={onAccept} />)

    await user.click(screen.getByRole('button', { name: /accept/i }))

    expect(onAccept).toHaveBeenCalledTimes(1)
  })

  it('shows Terms and Privacy links', () => {
    render(<ConsentBanner onAccept={() => {}} />)

    expect(screen.getByRole('link', { name: /terms/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /privacy/i })).toBeInTheDocument()
  })
})
