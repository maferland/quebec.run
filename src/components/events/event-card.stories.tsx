import type { Meta, StoryObj } from '@storybook/nextjs'
import { EventCard } from './event-card'

const meta = {
  title: 'Events/EventCard',
  component: EventCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof EventCard>

export default meta
type Story = StoryObj<typeof meta>

const mockEvent = {
  id: 'event-1',
  title: '6AM Club Limoilou',
  address: '250 3e Rue, Québec, QC G1L 2B3',
  date: new Date('2025-01-24T06:00:00'),
  time: '06:00',
  distance: '5-8 km',
  pace: 'Rythme modéré',
  club: {
    name: '6AM Club Quebec',
  },
}

export const Default: Story = {
  args: {
    event: mockEvent,
  },
}

export const WithClubName: Story = {
  args: {
    event: mockEvent,
    showClubName: true,
  },
}

export const WithoutLocation: Story = {
  args: {
    event: {
      ...mockEvent,
      address: null,
    },
  },
}

export const WithoutDescription: Story = {
  args: {
    event: mockEvent,
  },
}

export const MinimalEvent: Story = {
  args: {
    event: {
      ...mockEvent,
      address: null,
      distance: null,
      pace: null,
    },
  },
}
