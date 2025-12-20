import type { Meta, StoryObj } from '@storybook/nextjs'
import { ConfirmDeleteDialog } from './confirm-delete-dialog'

const meta: Meta<typeof ConfirmDeleteDialog> = {
  title: 'Admin/ConfirmDeleteDialog',
  component: ConfirmDeleteDialog,
  parameters: {
    layout: 'centered',
  },
}

export default meta
type Story = StoryObj<typeof ConfirmDeleteDialog>

export const Default: Story = {
  args: {
    open: true,
    onOpenChange: () => {},
    entityType: 'Club',
    entityName: 'Quebec City Runners',
    onConfirm: () => {},
    loading: false,
  },
}

export const Loading: Story = {
  args: {
    ...Default.args,
    loading: true,
  },
}

export const Event: Story = {
  args: {
    ...Default.args,
    entityType: 'Event',
    entityName: 'Morning Run - Dec 20',
  },
}
