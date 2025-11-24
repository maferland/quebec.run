import type { Meta, StoryObj } from '@storybook/nextjs'
import { MobileMenu } from './mobile-menu'

const meta: Meta<typeof MobileMenu> = {
  title: 'UI/MobileMenu',
  component: MobileMenu,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Mobile navigation menu with hamburger toggle for small screens.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-80 p-4 bg-surface">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithAdminUser: Story = {
  parameters: {
    nextauth: {
      session: {
        user: { isAdmin: true, name: 'Admin User' },
        expires: '2024-01-01',
      },
    },
  },
}

export const WithRegularUser: Story = {
  parameters: {
    nextauth: {
      session: {
        user: { isAdmin: false, name: 'Regular User' },
        expires: '2024-01-01',
      },
    },
  },
}
