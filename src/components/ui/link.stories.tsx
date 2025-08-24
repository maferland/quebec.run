import type { Meta, StoryObj } from '@storybook/nextjs'
import { Link } from './link'

const meta = {
  title: 'UI/Link',
  component: Link,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    external: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Link>

export default meta
type Story = StoryObj<typeof meta>

export const Internal: Story = {
  args: {
    href: '/clubs',
    children: 'View All Clubs',
  },
}

export const External: Story = {
  args: {
    href: 'https://example.com',
    children: 'Visit External Site',
    external: true,
  },
}

export const WithCustomStyles: Story = {
  args: {
    href: '/calendar',
    children: 'Calendar Page',
    className: 'font-bold text-lg',
  },
}
