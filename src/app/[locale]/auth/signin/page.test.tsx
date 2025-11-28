import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { signIn } from 'next-auth/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import SignInPage from './page'

vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}))

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) =>
    children,
}))

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (key: string) => (key === 'callbackUrl' ? '/admin' : null),
  }),
}))

describe('SignInPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders sign-in form with email input', () => {
    render(<SignInPage />)

    expect(
      screen.getByRole('heading', { name: 'signInTitle' })
    ).toBeInTheDocument()
    expect(screen.getByLabelText('emailLabel')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'sendMagicLink' })
    ).toBeInTheDocument()
  })

  it('validates email format', async () => {
    const user = userEvent.setup()
    render(<SignInPage />)

    const emailInput = screen.getByLabelText('emailLabel')
    const submitButton = screen.getByRole('button', { name: 'sendMagicLink' })

    await user.type(emailInput, 'invalid-email')
    await user.click(submitButton)

    expect(await screen.findByText('invalidEmail')).toBeInTheDocument()
    expect(signIn).not.toHaveBeenCalled()
  })

  it('submits valid email and shows success state', async () => {
    const user = userEvent.setup()
    vi.mocked(signIn).mockResolvedValue({
      ok: true,
      error: null,
      status: 200,
      url: null,
    })

    render(<SignInPage />)

    const emailInput = screen.getByLabelText('emailLabel')
    const submitButton = screen.getByRole('button', { name: 'sendMagicLink' })

    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith('email', {
        email: 'test@example.com',
        callbackUrl: '/admin',
        redirect: false,
      })
    })

    expect(screen.getByText('checkYourEmail')).toBeInTheDocument()
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
  })

  it('shows loading state during submission', async () => {
    const user = userEvent.setup()
    vi.mocked(signIn).mockImplementation(() => new Promise(() => {}))

    render(<SignInPage />)

    const emailInput = screen.getByLabelText('emailLabel')
    const submitButton = screen.getByRole('button', { name: 'sendMagicLink' })

    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)

    expect(screen.getByText('sendingLink')).toBeInTheDocument()
    expect(submitButton).toBeDisabled()
  })

  it('includes callbackUrl from query params', async () => {
    const user = userEvent.setup()
    vi.mocked(signIn).mockResolvedValue({
      ok: true,
      error: null,
      status: 200,
      url: null,
    })

    render(<SignInPage />)

    const emailInput = screen.getByLabelText('emailLabel')
    await user.type(emailInput, 'test@example.com')
    await user.click(screen.getByRole('button', { name: 'sendMagicLink' }))

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith('email', {
        email: 'test@example.com',
        callbackUrl: '/admin',
        redirect: false,
      })
    })
  })
})
