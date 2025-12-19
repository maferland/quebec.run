import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@/lib/test-utils'
import userEvent from '@testing-library/user-event'
import { DeleteClubButton } from './delete-club-button'
import { setupMSW } from '@/lib/test-msw-setup'

// Setup MSW
setupMSW()

// Mock next/navigation
const mockRefresh = vi.fn()
vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}))

describe('DeleteClubButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.alert = vi.fn()
  })

  it('renders delete button with text and icon', () => {
    render(<DeleteClubButton clubId="club-1" clubName="Test Club" />)

    const button = screen.getByRole('button', { name: /delete/i })
    expect(button).toBeInTheDocument()
  })

  it('shows confirmation dialog when clicked', async () => {
    const user = userEvent.setup()

    render(<DeleteClubButton clubId="club-1" clubName="Test Club" />)

    await user.click(screen.getByRole('button', { name: /delete/i }))

    // Should show dialog instead of browser confirm
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/test club/i)).toBeInTheDocument()
  })

  it('does not delete when user cancels confirmation', async () => {
    const user = userEvent.setup()

    render(<DeleteClubButton clubId="club-1" clubName="Test Club" />)

    await user.click(screen.getByRole('button', { name: /delete/i }))
    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(mockRefresh).not.toHaveBeenCalled()
  })

  it('deletes club and refreshes when confirmed', async () => {
    const user = userEvent.setup()

    render(<DeleteClubButton clubId="club-1" clubName="Test Club" />)

    await user.click(screen.getByRole('button', { name: /delete/i }))

    // Find delete button inside dialog
    const dialog = screen.getByRole('dialog')
    const dialogDeleteButton = within(dialog).getByRole('button', {
      name: /^delete$/i,
    })
    await user.click(dialogDeleteButton)

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled()
    })
  })

  it('disables button while deleting', async () => {
    const user = userEvent.setup()

    // Mock a slow API call
    const { server } = await import('@/lib/test-msw')
    const { http, HttpResponse, delay } = await import('msw')

    server.use(
      http.delete('/api/clubs/:id', async () => {
        await delay(100)
        return HttpResponse.json({ success: true })
      })
    )

    render(<DeleteClubButton clubId="club-1" clubName="Test Club" />)

    const button = screen.getByRole('button', { name: /delete/i })
    await user.click(button)

    // Click delete button inside dialog
    const dialog = screen.getByRole('dialog')
    const dialogDeleteButton = within(dialog).getByRole('button', {
      name: /^delete$/i,
    })
    await user.click(dialogDeleteButton)

    // Both buttons should be disabled while deleting
    await waitFor(() => {
      expect(dialogDeleteButton).toBeDisabled()
    })
  })

  it('shows alert on delete error', async () => {
    const user = userEvent.setup()
    const mockAlert = vi.fn()
    global.alert = mockAlert

    // Mock API error
    const { server } = await import('@/lib/test-msw')
    const { http, HttpResponse } = await import('msw')

    server.use(
      http.delete('/api/clubs/:id', () => {
        return HttpResponse.json({ error: 'Server error' }, { status: 500 })
      })
    )

    render(<DeleteClubButton clubId="club-1" clubName="Test Club" />)

    await user.click(screen.getByRole('button', { name: /delete/i }))

    // Click delete button inside dialog
    const dialog = screen.getByRole('dialog')
    const dialogDeleteButton = within(dialog).getByRole('button', {
      name: /^delete$/i,
    })
    await user.click(dialogDeleteButton)

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith(
        'Failed to delete club. Please try again.'
      )
    })
  })

  it('re-enables button after error', async () => {
    const user = userEvent.setup()
    global.alert = vi.fn()

    // Mock API error
    const { server } = await import('@/lib/test-msw')
    const { http, HttpResponse } = await import('msw')

    server.use(
      http.delete('/api/clubs/:id', () => {
        return HttpResponse.json({ error: 'Server error' }, { status: 500 })
      })
    )

    render(<DeleteClubButton clubId="club-1" clubName="Test Club" />)

    const button = screen.getByRole('button', { name: /delete/i })
    await user.click(button)

    // Click delete button inside dialog
    const dialog = screen.getByRole('dialog')
    const dialogDeleteButton = within(dialog).getByRole('button', {
      name: /^delete$/i,
    })
    await user.click(dialogDeleteButton)

    // Wait for error handling to complete
    await waitFor(() => {
      expect(dialogDeleteButton).not.toBeDisabled()
    })
  })

  describe('Accessibility', () => {
    it('has accessible label with club name', () => {
      render(<DeleteClubButton clubId="club-1" clubName="My Running Club" />)

      const button = screen.getByRole('button', { name: /delete/i })
      expect(button).toHaveAttribute('aria-label', 'Delete My Running Club')
    })

    it('supports keyboard interaction', async () => {
      const user = userEvent.setup()

      render(<DeleteClubButton clubId="club-1" clubName="Test Club" />)

      const button = screen.getByRole('button', { name: /delete/i })
      button.focus()
      expect(button).toHaveFocus()

      await user.keyboard('{Enter}')

      // Dialog should open
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('is disabled when in deleting state', async () => {
      const user = userEvent.setup()

      const { server } = await import('@/lib/test-msw')
      const { http, HttpResponse, delay } = await import('msw')

      server.use(
        http.delete('/api/clubs/:id', async () => {
          await delay(100)
          return HttpResponse.json({ success: true })
        })
      )

      render(<DeleteClubButton clubId="club-1" clubName="Test Club" />)

      const button = screen.getByRole('button', { name: /delete/i })
      await user.click(button)

      // Click delete button inside dialog
      const dialog = screen.getByRole('dialog')
      const dialogDeleteButton = within(dialog).getByRole('button', {
        name: /^delete$/i,
      })
      await user.click(dialogDeleteButton)

      await waitFor(() => {
        expect(dialogDeleteButton).toBeDisabled()
      })
    })
  })
})
