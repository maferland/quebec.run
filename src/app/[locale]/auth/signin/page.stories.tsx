import type { Meta, StoryObj } from '@storybook/nextjs'
import { expect, userEvent, within } from 'storybook/test'
import { http, HttpResponse, delay } from 'msw'
import { withLoggedOutSession } from '@/lib/storybook-utils'
import SignInPage from './page'

const meta: Meta<typeof SignInPage> = {
  title: 'Pages/Auth/SignIn',
  component: SignInPage,
  decorators: [withLoggedOutSession],
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
      navigation: {
        searchParams: { callbackUrl: '/' },
      },
    },
    msw: {
      handlers: [
        http.post('/api/auth/signin/email', () => {
          return HttpResponse.json({ ok: true, url: '/' })
        }),
      ],
    },
  },
}

export default meta
type Story = StoryObj<typeof SignInPage>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(
      canvas.getByRole('heading', { name: /welcome/i })
    ).toBeInTheDocument()
    await expect(canvas.getByLabelText(/email/i)).toBeInTheDocument()
  },
}

export const WithValidationError: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()

    const emailInput = canvas.getByLabelText(/email/i)
    const submitButton = canvas.getByRole('button', {
      name: /send magic link/i,
    })

    await user.type(emailInput, 'invalid-email')
    await user.click(submitButton)

    await expect(canvas.getByText(/please enter a valid/i)).toBeInTheDocument()
  },
}

export const LoadingState: Story = {
  parameters: {
    msw: {
      handlers: [
        http.post('/api/auth/signin/email', async () => {
          await delay('infinite')
          return HttpResponse.json({ ok: true, url: '/' })
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const user = userEvent.setup()

    const emailInput = canvas.getByLabelText(/email/i)
    const submitButton = canvas.getByRole('button', {
      name: /send magic link/i,
    })

    await user.type(emailInput, 'test@example.com')
    await user.click(submitButton)

    // Verify loading state appears
    await expect(
      canvas.getByRole('button', { name: /sending/i })
    ).toBeInTheDocument()
    await expect(
      canvas.getByRole('button', { name: /sending/i })
    ).toBeDisabled()
  },
}
