import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { ConfirmStaffDialog } from './confirm-staff-dialog'
import { describe, it, expect, vi } from 'vitest'

describe('ConfirmStaffDialog', () => {
  const mockUser = {
    email: 'test@example.com',
    name: 'Test User',
  }

  it('renders dialog when open', () => {
    render(
      <ConfirmStaffDialog
        open={true}
        onOpenChange={vi.fn()}
        user={mockUser}
        action="promote"
        onConfirm={vi.fn()}
        loading={false}
      />
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('shows promotion title for promote action', () => {
    render(
      <ConfirmStaffDialog
        open={true}
        onOpenChange={vi.fn()}
        user={mockUser}
        action="promote"
        onConfirm={vi.fn()}
        loading={false}
      />
    )

    expect(
      screen.getByText(/Make Test User platform staff/i)
    ).toBeInTheDocument()
  })

  it('shows demotion title for demote action', () => {
    render(
      <ConfirmStaffDialog
        open={true}
        onOpenChange={vi.fn()}
        user={mockUser}
        action="demote"
        onConfirm={vi.fn()}
        loading={false}
      />
    )

    expect(screen.getByText(/Remove Test User from staff/i)).toBeInTheDocument()
  })

  it('shows staff privileges for promote action', () => {
    render(
      <ConfirmStaffDialog
        open={true}
        onOpenChange={vi.fn()}
        user={mockUser}
        action="promote"
        onConfirm={vi.fn()}
        loading={false}
      />
    )

    expect(screen.getByText(/Staff members can:/i)).toBeInTheDocument()
    expect(screen.getByText(/Manage all clubs and events/i)).toBeInTheDocument()
  })

  it('requires typing email to enable confirm button', async () => {
    const user = userEvent.setup()
    render(
      <ConfirmStaffDialog
        open={true}
        onOpenChange={vi.fn()}
        user={mockUser}
        action="promote"
        onConfirm={vi.fn()}
        loading={false}
      />
    )

    const confirmButton = screen.getByRole('button', { name: /Make Staff/i })
    expect(confirmButton).toBeDisabled()

    const input = screen.getByPlaceholderText(mockUser.email)
    await user.type(input, mockUser.email)

    expect(confirmButton).toBeEnabled()
  })

  it('calls onConfirm when confirm button clicked with valid input', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()

    render(
      <ConfirmStaffDialog
        open={true}
        onOpenChange={vi.fn()}
        user={mockUser}
        action="promote"
        onConfirm={onConfirm}
        loading={false}
      />
    )

    const input = screen.getByPlaceholderText(mockUser.email)
    await user.type(input, mockUser.email)

    const confirmButton = screen.getByRole('button', { name: /Make Staff/i })
    await user.click(confirmButton)

    expect(onConfirm).toHaveBeenCalled()
  })

  it('disables inputs during loading', () => {
    render(
      <ConfirmStaffDialog
        open={true}
        onOpenChange={vi.fn()}
        user={mockUser}
        action="promote"
        onConfirm={vi.fn()}
        loading={true}
      />
    )

    const input = screen.getByPlaceholderText(mockUser.email)
    expect(input).toBeDisabled()

    const confirmButton = screen.getByRole('button', { name: /Processing/i })
    expect(confirmButton).toBeDisabled()
  })

  it('shows destructive styling for demote action', () => {
    render(
      <ConfirmStaffDialog
        open={true}
        onOpenChange={vi.fn()}
        user={mockUser}
        action="demote"
        onConfirm={vi.fn()}
        loading={false}
      />
    )

    const confirmButton = screen.getByRole('button', { name: /Remove Staff/i })
    expect(confirmButton).toHaveClass('destructive')
  })
})
