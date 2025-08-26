import type { Meta, StoryObj } from '@storybook/nextjs'
import { NavLink } from './nav-link'
import { Users, Calendar, Info, Phone } from 'lucide-react'

const meta: Meta<typeof NavLink> = {
  title: 'UI/NavLink',
  component: NavLink,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    isActive: {
      control: 'boolean',
      description: 'Whether the nav link is currently active',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    href: '/clubs',
    children: (
      <>
        <Users size={18} />
        <span>Clubs</span>
      </>
    ),
  },
}

export const Active: Story = {
  args: {
    href: '/clubs',
    isActive: true,
    children: (
      <>
        <Users size={18} />
        <span>Clubs</span>
      </>
    ),
  },
}

export const Events: Story = {
  args: {
    href: '/events',
    children: (
      <>
        <Calendar size={18} />
        <span>Events</span>
      </>
    ),
  },
}

export const About: Story = {
  args: {
    href: '/about',
    children: (
      <>
        <Info size={18} />
        <span>About</span>
      </>
    ),
  },
}

export const Contact: Story = {
  args: {
    href: '/contact',
    children: (
      <>
        <Phone size={18} />
        <span>Contact</span>
      </>
    ),
  },
}

export const TextOnly: Story = {
  args: {
    href: '/admin',
    children: <span>Admin</span>,
  },
}
