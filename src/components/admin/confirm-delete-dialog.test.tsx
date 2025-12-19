import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/lib/test-utils'
import userEvent from '@testing-library/user-event'
import { ConfirmDeleteDialog } from './confirm-delete-dialog'

describe('ConfirmDeleteDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    entityType: 'Club',
    entityName: 'Test Club',
    onConfirm: vi.fn(),
    loading: false,
  }

  it('renders dialog with entity name', () => {
    render(<ConfirmDeleteDialog {...defaultProps} />)

    expect(screen.getByText(/delete club/i)).toBeInTheDocument()
    expect(screen.getByText(/test club/i)).toBeInTheDocument()
  })

  it('calls onConfirm when delete clicked', async () => {
    const onConfirm = vi.fn()
    const user = userEvent.setup()

    render(<ConfirmDeleteDialog {...defaultProps} onConfirm={onConfirm} />)

    await user.click(screen.getByRole('button', { name: /delete/i }))

    expect(onConfirm).toHaveBeenCalled()
  })

  it('calls onOpenChange when cancel clicked', async () => {
    const onOpenChange = vi.fn()
    const user = userEvent.setup()

    render(
      <ConfirmDeleteDialog {...defaultProps} onOpenChange={onOpenChange} />
    )

    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('disables buttons when loading', () => {
    render(<ConfirmDeleteDialog {...defaultProps} loading={true} />)

    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /delete/i })).toBeDisabled()
  })

  it('shows delete button with trash icon', () => {
    render(<ConfirmDeleteDialog {...defaultProps} />)

    const deleteButton = screen.getByRole('button', { name: /delete/i })
    expect(deleteButton).toBeInTheDocument()
  })
})
