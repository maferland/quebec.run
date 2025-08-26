import type { Meta, StoryObj } from '@storybook/nextjs'
import { Clock, MapPin, Timer, Calendar, Users } from 'lucide-react'
import { Tag } from './tag'

const meta = {
  title: 'UI/Tag',
  component: Tag,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'date',
        'distance',
        'pace',
        'time',
        'datetime',
        'training',
        'social',
      ],
    },
    colorScheme: {
      control: 'select',
      options: ['primary', 'secondary', 'accent', 'success', 'warning', 'gray'],
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg'],
    },
  },
} satisfies Meta<typeof Tag>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: '5-8 km',
    variant: 'distance',
  },
}

export const WithIcon: Story = {
  args: {
    children: 'Wed, Sep 4 • 06:00',
    variant: 'datetime',
    icon: Clock,
  },
}

export const AllSizes: Story = {
  args: { children: 'Tag' },
  render: () => (
    <div className="flex items-center gap-4">
      <Tag size="xs" icon={MapPin}>
        Extra Small
      </Tag>
      <Tag size="sm" icon={Clock}>
        Small
      </Tag>
      <Tag size="md" icon={Timer}>
        Medium
      </Tag>
      <Tag size="lg" icon={Calendar}>
        Large
      </Tag>
    </div>
  ),
}

export const AllColorSchemes: Story = {
  args: { children: 'Tag' },
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Tag colorScheme="primary" icon={Users}>
        Primary
      </Tag>
      <Tag colorScheme="secondary" icon={Clock}>
        Secondary
      </Tag>
      <Tag colorScheme="accent" icon={Timer}>
        Accent
      </Tag>
      <Tag colorScheme="success" icon={MapPin}>
        Success
      </Tag>
      <Tag colorScheme="warning" icon={Calendar}>
        Warning
      </Tag>
      <Tag colorScheme="gray">Gray</Tag>
    </div>
  ),
}

export const LegacyVariants: Story = {
  args: { children: 'Tag' },
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Tag variant="date">Sep 4</Tag>
      <Tag variant="distance">5-8 km</Tag>
      <Tag variant="pace">Rythme modéré</Tag>
      <Tag variant="time">06:00</Tag>
      <Tag variant="datetime" icon={Clock}>
        Wed, Sep 4 • 06:00
      </Tag>
      <Tag variant="training">Training</Tag>
      <Tag variant="social">Social</Tag>
    </div>
  ),
}

export const EventCardExample: Story = {
  args: { children: 'Tag' },
  render: () => (
    <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg max-w-sm">
      <Tag variant="datetime" icon={Clock} size="xs">
        Wed, Sep 4 • 06:00
      </Tag>
      <Tag variant="distance" size="xs">
        5-8 km
      </Tag>
      <Tag variant="pace" size="xs">
        Rythme modéré
      </Tag>
    </div>
  ),
}

export const CustomIconSize: Story = {
  args: {
    children: 'Custom Icon',
    colorScheme: 'primary',
    icon: Users,
    iconSize: 20,
  },
}
