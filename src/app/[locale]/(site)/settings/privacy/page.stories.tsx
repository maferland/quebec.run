import type { Meta, StoryObj } from '@storybook/nextjs'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import PrivacySettingsPage from './page'

const mockSession = {
  user: {
    id: '1',
    email: 'user@example.com',
    name: 'Test User',
    isStaff: false,
  },
  expires: '2024-12-31',
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

const meta: Meta<typeof PrivacySettingsPage> = {
  title: 'Pages/Settings/Privacy',
  component: PrivacySettingsPage,
  parameters: {
    layout: 'fullscreen',
    nextjs: {
      appDirectory: true,
    },
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <SessionProvider session={mockSession}>
          <Story />
        </SessionProvider>
      </QueryClientProvider>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  parameters: {
    mockData: [
      {
        url: '/api/user/delete',
        method: 'GET',
        status: 200,
        response: {
          hasPendingRequest: false,
        },
      },
    ],
  },
}

export const PendingDeletion: Story = {
  parameters: {
    mockData: [
      {
        url: '/api/user/delete',
        method: 'GET',
        status: 200,
        response: {
          hasPendingRequest: true,
          request: {
            id: 'req-123',
            scheduledFor: '2024-12-31T00:00:00Z',
          },
        },
      },
    ],
  },
}
