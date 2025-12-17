import type { Meta, StoryObj } from '@storybook/nextjs'
import { StaffActionsMenu } from './staff-actions-menu'

const meta: Meta<typeof StaffActionsMenu> = {
  title: 'Admin/StaffActionsMenu',
  component: StaffActionsMenu,
  parameters: {
    layout: 'centered',
  },
}

export default meta
type Story = StoryObj<typeof meta>

const mockNonStaffUser = {
  id: 'user-1',
  name: 'John Doe',
  email: 'john@example.com',
  isStaff: false,
}

const mockStaffUser = {
  id: 'user-2',
  name: 'Jane Smith',
  email: 'jane@example.com',
  isStaff: true,
}

export const NonStaffUser: Story = {
  args: {
    user: mockNonStaffUser,
    currentUserId: 'current-user',
    onToggleStaff: () => console.log('Toggle staff'),
  },
}

export const StaffUser: Story = {
  args: {
    user: mockStaffUser,
    currentUserId: 'current-user',
    onToggleStaff: () => console.log('Toggle staff'),
  },
}

export const CurrentUser: Story = {
  args: {
    user: {
      ...mockStaffUser,
      id: 'current-user',
    },
    currentUserId: 'current-user',
    onToggleStaff: () => console.log('Toggle staff'),
  },
}
