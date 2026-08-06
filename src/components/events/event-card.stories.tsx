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
  slug: null,
  title: '6AM Club Limoilou',
  description: null,
  address: '250 3e Rue, Québec, QC G1L 2B3',
  date: new Date('2025-01-24T06:00:00'),
  time: '06:00',
  distance: '5-8 km',
  pace: 'Rythme modéré',
  pacePolicy: null,
  latitude: 46.8139,
  longitude: -71.208,
  status: 'SCHEDULED' as const,
  clubId: 'club-1',
  organizationId: null,
  recurringEventId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  geocodedAt: null,
  club: {
    id: 'club-1',
    name: '6AM Club Quebec',
    slug: '6am-club-quebec',
    type: null,
    vibe: null,
    beginnerFriendly: false,
    paceMin: null,
    paceMax: null,
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
