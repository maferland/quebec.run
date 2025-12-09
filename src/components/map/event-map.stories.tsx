import type { Meta, StoryObj } from '@storybook/nextjs'
import { EventMap } from './event-map'

const meta: Meta<typeof EventMap> = {
  title: 'Map/EventMap',
  component: EventMap,
  parameters: {
    layout: 'fullscreen',
  },
}

export default meta
type Story = StoryObj<typeof EventMap>

const mockEvents = [
  {
    id: '1',
    title: 'Morning Run - Old Quebec',
    date: new Date('2025-12-01T09:00:00'),
    time: '09:00',
    address: '1 Rue des Carrières, Quebec City, QC',
    latitude: 46.8139,
    longitude: -71.208,
    club: { id: 'club1', name: 'Quebec Runners', slug: 'quebec-runners' },
  },
  {
    id: '2',
    title: 'Evening Trail Run',
    date: new Date('2025-12-01T18:00:00'),
    time: '18:00',
    address: '2 Avenue du Parc, Quebec City, QC',
    latitude: 46.8239,
    longitude: -71.218,
    club: { id: 'club1', name: 'Quebec Runners', slug: 'quebec-runners' },
  },
  {
    id: '3',
    title: 'Weekend Long Run',
    date: new Date('2025-12-07T08:00:00'),
    time: '08:00',
    address: 'Plains of Abraham, Quebec City, QC',
    latitude: 46.8029,
    longitude: -71.216,
    club: { id: 'club2', name: 'Trail Runners QC', slug: 'trail-runners-qc' },
  },
]

const manyEvents = Array.from({ length: 50 }, (_, i) => ({
  id: `event-${i}`,
  title: `Run Event ${i + 1}`,
  date: new Date('2025-12-01T09:00:00'),
  time: '09:00',
  address: `${i} Rue Example, Quebec City, QC`,
  latitude: 46.8139 + (Math.random() - 0.5) * 0.1,
  longitude: -71.208 + (Math.random() - 0.5) * 0.1,
  club: { id: 'club1', name: 'Quebec Runners', slug: 'quebec-runners' },
}))

export const Default: Story = {
  args: {
    events: mockEvents,
  },
}

export const SingleEvent: Story = {
  args: {
    events: [mockEvents[0]],
  },
}

export const ManyEvents: Story = {
  args: {
    events: manyEvents,
  },
}

export const NoGeocodedEvents: Story = {
  args: {
    events: [
      {
        id: '4',
        title: 'Event Without Coordinates',
        date: new Date('2025-12-01T09:00:00'),
        time: '09:00',
        address: null,
        latitude: null,
        longitude: null,
        club: { id: 'club1', name: 'Quebec Runners', slug: 'quebec-runners' },
      },
    ],
  },
}

export const Empty: Story = {
  args: {
    events: [],
  },
}
