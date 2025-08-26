import type { Meta, StoryObj } from '@storybook/nextjs'
import {
  Skeleton,
  SkeletonCard,
  LoadingState,
  SkeletonList,
  EventCardSkeleton,
  ClubCardSkeleton,
  PageLoading,
  SectionLoading,
} from './skeleton'

const meta = {
  title: 'UI/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Skeleton loading components for smooth loading states across the Quebec.run application. Provides consistent loading animations and accessibility features.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Skeleton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    className: 'h-4 w-32',
  },
}

export const BasicSkeletons: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="font-heading font-bold mb-2">Text Skeletons</h3>
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>

      <div>
        <h3 className="font-heading font-bold mb-2">Shape Skeletons</h3>
        <div className="flex items-center gap-4">
          <Skeleton className="w-12 h-12" rounded="full" />
          <Skeleton className="w-16 h-10" rounded="md" />
          <Skeleton className="w-20 h-6" rounded="lg" />
          <Skeleton className="w-8 h-8" rounded="none" />
        </div>
      </div>

      <div>
        <h3 className="font-heading font-bold mb-2">Animation Types</h3>
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" animation="pulse" />
          <Skeleton className="h-4 w-32" animation="shimmer" />
          <Skeleton className="h-4 w-32" animation="none" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Basic skeleton elements for creating custom loading states. Available animations: pulse (default), shimmer, none.',
      },
    },
  },
}

export const SkeletonCardDefault: Story = {
  render: () => <SkeletonCard />,
  parameters: {
    docs: {
      description: {
        story:
          'Default skeleton card with basic structure - title and content lines.',
      },
    },
  },
}

export const SkeletonCardVariations: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h3 className="font-heading font-bold mb-4">With Avatar</h3>
        <SkeletonCard showAvatar lines={3} />
      </div>

      <div>
        <h3 className="font-heading font-bold mb-4">With Actions</h3>
        <SkeletonCard showActions lines={2} />
      </div>

      <div>
        <h3 className="font-heading font-bold mb-4">Compact</h3>
        <SkeletonCard variant="compact" showAvatar />
      </div>

      <div>
        <h3 className="font-heading font-bold mb-4">Full Featured</h3>
        <SkeletonCard showAvatar showActions lines={4} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'SkeletonCard with different configurations - avatars, action buttons, line counts, and compact mode.',
      },
    },
  },
}

export const EventCardSkeletonStory: Story = {
  render: () => (
    <div className="max-w-sm">
      <h3 className="font-heading font-bold mb-4">Event Card Loading</h3>
      <EventCardSkeleton />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Skeleton that matches the EventCard component layout exactly - includes datetime tag, event tags, and location section.',
      },
    },
  },
}

export const ClubCardSkeletonStory: Story = {
  render: () => (
    <div className="max-w-md">
      <h3 className="font-heading font-bold mb-4">Club Card Loading</h3>
      <ClubCardSkeleton />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Skeleton that matches the ClubCard component layout exactly - includes club icon, events preview, and action footer.',
      },
    },
  },
}

export const LoadingStates: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="font-heading font-bold mb-4">Different Sizes</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 border rounded-lg">
            <LoadingState size="sm" text="Small loading..." />
          </div>
          <div className="p-4 border rounded-lg">
            <LoadingState size="md" text="Medium loading..." />
          </div>
          <div className="p-4 border rounded-lg">
            <LoadingState size="lg" text="Large loading..." />
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-heading font-bold mb-4">
          With and Without Spinner
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 border rounded-lg">
            <LoadingState text="Loading with spinner..." />
          </div>
          <div className="p-4 border rounded-lg">
            <LoadingState
              showSpinner={false}
              text="Loading without spinner..."
            />
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'LoadingState component with different sizes and spinner options. Perfect for showing loading progress.',
      },
    },
  },
}

export const SkeletonLists: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="font-heading font-bold mb-4">Vertical Event List</h3>
        <SkeletonList count={3} variant="event" />
      </div>

      <div>
        <h3 className="font-heading font-bold mb-4">Vertical Club List</h3>
        <SkeletonList count={2} variant="club" />
      </div>

      <div>
        <h3 className="font-heading font-bold mb-4">Horizontal Compact List</h3>
        <SkeletonList count={5} variant="compact" direction="horizontal" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'SkeletonList component for loading multiple items. Supports different variants and horizontal/vertical layouts.',
      },
    },
  },
}

export const PageLoadingStory: Story = {
  render: () => <PageLoading title="Loading Quebec Run dashboard..." />,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story:
          'Full-page loading component with minimum height and large spinner for initial page loads.',
      },
    },
  },
}

export const SectionLoadingStory: Story = {
  render: () => (
    <div className="border rounded-lg">
      <div className="p-4 border-b bg-gray-50">
        <h2 className="font-heading font-bold">Upcoming Events</h2>
      </div>
      <SectionLoading title="Loading events..." />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Section loading component for partial page updates and content areas.',
      },
    },
  },
}

export const RealWorldExample: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-heading font-bold text-primary mb-6">
          Quebec.run Dashboard Loading States
        </h2>

        {/* Hero Stats Loading */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-4 bg-primary/10 rounded-lg">
            <Skeleton className="h-8 w-12 mb-2" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="p-4 bg-secondary/10 rounded-lg">
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="p-4 bg-accent/10 rounded-lg">
            <Skeleton className="h-8 w-8 mb-2" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>

        {/* Events Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <EventCardSkeleton />
            <EventCardSkeleton />
            <EventCardSkeleton />
          </div>
        </div>

        {/* Clubs Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ClubCardSkeleton />
            <ClubCardSkeleton />
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Complete loading state example showing how skeleton components work together in a real Quebec.run dashboard layout.',
      },
    },
  },
}

export const LoadingProgression: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="p-4 border rounded-lg">
        <h3 className="font-heading font-bold mb-4">Stage 1: Page Loading</h3>
        <PageLoading title="Loading Quebec.run..." />
      </div>

      <div className="p-4 border rounded-lg">
        <h3 className="font-heading font-bold mb-4">
          Stage 2: Content Loading
        </h3>
        <div className="mb-4">
          <Skeleton className="h-8 w-48 mb-4" />
        </div>
        <SkeletonList count={2} variant="event" />
      </div>

      <div className="p-4 border rounded-lg">
        <h3 className="font-heading font-bold mb-4">
          Stage 3: Section Loading
        </h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8" rounded="full" />
            <div className="flex-1">
              <Skeleton className="h-5 w-32 mb-1" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <SectionLoading title="Loading additional events..." />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Progressive loading states showing how different skeleton components can be used during different phases of content loading.',
      },
    },
  },
}

export const AccessibilityExample: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-heading font-bold mb-4">Proper ARIA Labels</h3>
        <div className="space-y-4">
          <SkeletonCard />
          <LoadingState text="Loading user profile..." />
          <SkeletonList count={2} variant="club" />
        </div>
      </div>

      <div className="p-4 bg-blue-50 rounded-lg">
        <h4 className="font-bold text-sm mb-2">🔍 Accessibility Features:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>
            • All skeleton components have role=&quot;status&quot; for screen
            readers
          </li>
          <li>
            • LoadingState uses aria-live=&quot;polite&quot; for dynamic updates
          </li>
          <li>• Spinners are hidden from screen readers with aria-hidden</li>
          <li>• Descriptive aria-label attributes for context</li>
        </ul>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Demonstration of accessibility features built into all skeleton components for screen reader compatibility.',
      },
    },
  },
}
