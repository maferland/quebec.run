import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { StaffActionsMenu } from './staff-actions-menu'
import { describe, it, expect, vi } from 'vitest'

describe('StaffActionsMenu', () => {
  const mockUser = {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    isStaff: false,
  }

  it('renders menu trigger button', () => {
    render(
      <StaffActionsMenu
        user={mockUser}
        currentUserId="current-user"
        onToggleStaff={vi.fn()}
      />
    )

    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('shows "Make Staff" option for non-staff user', async () => {
    const user = userEvent.setup()
    render(
      <StaffActionsMenu
        user={mockUser}
        currentUserId="current-user"
        onToggleStaff={vi.fn()}
      />
    )

    await user.click(screen.getByRole('button'))
    expect(screen.getByText('Make Staff')).toBeInTheDocument()
  })

  it('shows "Remove Staff" option for staff user', async () => {
    const user = userEvent.setup()
    const staffUser = { ...mockUser, isStaff: true }

    render(
      <StaffActionsMenu
        user={staffUser}
        currentUserId="current-user"
        onToggleStaff={vi.fn()}
      />
    )

    await user.click(screen.getByRole('button'))
    expect(screen.getByText('Remove Staff')).toBeInTheDocument()
  })

  it('disables "Remove Staff" for current user', async () => {
    const user = userEvent.setup()
    const staffUser = { ...mockUser, isStaff: true }

    render(
      <StaffActionsMenu
        user={staffUser}
        currentUserId={mockUser.id}
        onToggleStaff={vi.fn()}
      />
    )

    await user.click(screen.getByRole('button'))
    const removeButton = screen.getByText('Remove Staff')
    expect(removeButton).toHaveAttribute('data-disabled', 'true')
  })

  it('calls onToggleStaff with correct params when making staff', async () => {
    const user = userEvent.setup()
    const onToggleStaff = vi.fn()

    render(
      <StaffActionsMenu
        user={mockUser}
        currentUserId="current-user"
        onToggleStaff={onToggleStaff}
      />
    )

    await user.click(screen.getByRole('button'))
    await user.click(screen.getByText('Make Staff'))

    expect(onToggleStaff).toHaveBeenCalledWith(mockUser.id, true)
  })

  it('calls onToggleStaff with correct params when removing staff', async () => {
    const user = userEvent.setup()
    const onToggleStaff = vi.fn()
    const staffUser = { ...mockUser, isStaff: true }

    render(
      <StaffActionsMenu
        user={staffUser}
        currentUserId="current-user"
        onToggleStaff={onToggleStaff}
      />
    )

    await user.click(screen.getByRole('button'))
    await user.click(screen.getByText('Remove Staff'))

    expect(onToggleStaff).toHaveBeenCalledWith(mockUser.id, false)
  })
})
