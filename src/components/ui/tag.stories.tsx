import type { Meta, StoryObj } from '@storybook/nextjs'
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
      control: { type: 'select' },
      options: ['date', 'distance', 'pace', 'time', 'training', 'social'],
    },
  },
} satisfies Meta<typeof Tag>

export default meta
type Story = StoryObj<typeof meta>

export const Date: Story = {
  args: {
    variant: 'date',
    children: 'ven. 24 janv.',
  },
}

export const Distance: Story = {
  args: {
    variant: 'distance',
    children: '5-8 km',
  },
}

export const Pace: Story = {
  args: {
    variant: 'pace',
    children: 'Rythme modéré',
  },
}

export const Time: Story = {
  args: {
    variant: 'time',
    children: '06:00',
  },
}

export const Training: Story = {
  args: {
    variant: 'training',
    children: 'Training',
  },
}

export const Social: Story = {
  args: {
    variant: 'social',
    children: 'Social',
  },
}

export const AllVariants: Story = {
  args: {
    children: 'All Variants',
    variant: 'date',
  },
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Tag variant="date">ven. 24 janv.</Tag>
      <Tag variant="distance">5-8 km</Tag>
      <Tag variant="pace">Rythme modéré</Tag>
      <Tag variant="time">06:00</Tag>
      <Tag variant="training">Training</Tag>
      <Tag variant="social">Social</Tag>
    </div>
  ),
}
