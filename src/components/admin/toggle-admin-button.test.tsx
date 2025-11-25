import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/lib/test-utils'
import userEvent from '@testing-library/user-event'
import { ToggleAdminButton } from './toggle-admin-button'
import { setupMSW } from '@/lib/test-msw-setup'

setupMSW()

describe('ToggleAdminButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.confirm = vi.fn(() => true)
  })

  it('shows grant confirmation for non-admin user', async () => {
    const user = userEvent.setup()
    const mockConfirm = vi.fn(() => false)
    global.confirm = mockConfirm

    render(
      <ToggleAdminButton
        userId="user-1"
        userName="John Doe"
        isAdmin={false}
        isCurrentUser={false}
      />
    )

    await user.click(screen.getByRole('button'))

    expect(mockConfirm).toHaveBeenCalledWith('Grant admin access to John Doe?')
  })

  it('shows revoke confirmation for admin user', async () => {
    const user = userEvent.setup()
    const mockConfirm = vi.fn(() => false)
    global.confirm = mockConfirm

    render(
      <ToggleAdminButton
        userId="user-1"
        userName="Jane Admin"
        isAdmin={true}
        isCurrentUser={false}
      />
    )

    await user.click(screen.getByRole('button'))

    expect(mockConfirm).toHaveBeenCalledWith(
      'Revoke admin access from Jane Admin?'
    )
  })

  it('disables button for current user', () => {
    render(
      <ToggleAdminButton
        userId="user-1"
        userName="Current User"
        isAdmin={true}
        isCurrentUser={true}
      />
    )

    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('toggles admin status when confirmed', async () => {
    const user = userEvent.setup()
    global.confirm = vi.fn(() => true)

    render(
      <ToggleAdminButton
        userId="user-1"
        userName="John Doe"
        isAdmin={false}
        isCurrentUser={false}
      />
    )

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeDisabled()
    })
  })
})
