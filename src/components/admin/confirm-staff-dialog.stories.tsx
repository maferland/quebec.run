import type { Meta, StoryObj } from '@storybook/nextjs'
import { ConfirmStaffDialog } from './confirm-staff-dialog'

const meta: Meta<typeof ConfirmStaffDialog> = {
  title: 'Admin/ConfirmStaffDialog',
  component: ConfirmStaffDialog,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="min-h-[600px] flex items-center justify-center">
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

const mockUser = {
  email: 'test@example.com',
  name: 'Test User',
}

export const PromoteEmpty: Story = {
  args: {
    open: true,
    onOpenChange: () => console.log('Open change'),
    user: mockUser,
    action: 'promote',
    onConfirm: () => console.log('Confirmed'),
    loading: false,
  },
}

export const Demote: Story = {
  args: {
    open: true,
    onOpenChange: () => console.log('Open change'),
    user: mockUser,
    action: 'demote',
    onConfirm: () => console.log('Confirmed'),
    loading: false,
  },
}

export const Loading: Story = {
  args: {
    open: true,
    onOpenChange: () => console.log('Open change'),
    user: mockUser,
    action: 'promote',
    onConfirm: () => console.log('Confirmed'),
    loading: true,
  },
}
