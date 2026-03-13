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
  stravaSlug: null,
  _count: { recurringEvents: 2 },
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

export const SingleRecurringEvent: Story = {
  args: {
    club: {
      ...mockClub,
      _count: { recurringEvents: 1 },
    },
  },
}

export const NoRecurringEvents: Story = {
  args: {
    club: {
      ...mockClub,
      _count: { recurringEvents: 0 },
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
