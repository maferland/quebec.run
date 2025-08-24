import type { Meta, StoryObj } from '@storybook/nextjs'
import { ClubCard } from './club-card'
import type { GetAllClubsReturn } from '@/lib/services/clubs'

const meta: Meta<typeof ClubCard> = {
  title: 'Components/ClubCard',
  component: ClubCard,
  parameters: {
    layout: 'padded',
  },
}

export default meta
type Story = StoryObj<typeof meta>

const mockClub: GetAllClubsReturn = {
  id: 'club-1',
  name: '6AM Club',
  slug: '6am-club',
  description:
    'Club de course matinal présent dans plusieurs quartiers de Québec. Rendez-vous à 6h pile!',
  events: [
    {
      id: 'event-1',
      title: '6AM Club Limoilou',
      date: new Date('2025-01-24T06:00:00'),
      time: '06:00',
      distance: '5-8 km',
      pace: 'Rythme modéré',
    },
    {
      id: 'event-2',
      title: '6AM Club Saint-Jean-Baptiste',
      date: new Date('2025-01-22T06:00:00'),
      time: '06:00',
      distance: '5-8 km',
      pace: 'Rythme modéré',
    },
  ],
}

export const Default: Story = {
  args: {
    club: mockClub,
  },
}

export const WithoutDescription: Story = {
  args: {
    club: {
      ...mockClub,
      description: null,
    },
  },
}

export const SingleEvent: Story = {
  args: {
    club: {
      ...mockClub,
      events: [mockClub.events[0]],
    },
  },
}

export const NoEvents: Story = {
  args: {
    club: {
      ...mockClub,
      events: [],
    },
  },
}

export const LongClubName: Story = {
  args: {
    club: {
      ...mockClub,
      name: 'Très Long Nom de Club de Course Matinale de Québec',
    },
  },
}
