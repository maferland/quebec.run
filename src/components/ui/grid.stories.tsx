import type { Meta, StoryObj } from '@storybook/nextjs'
import {
  ResponsiveGrid,
  GridItem,
  TwoColumnGrid,
  ThreeColumnGrid,
  EventGrid,
  ClubGrid,
  DashboardGrid,
  DashboardMain,
  DashboardSidebar,
} from './grid'
import { Card } from './card'

const meta = {
  title: 'UI/Grid',
  component: ResponsiveGrid,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Responsive grid system for consistent layouts across the Quebec.run application. Provides mobile-first responsive grids with flexible column configurations and gap options.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ResponsiveGrid>

export default meta
type Story = StoryObj<typeof meta>

// Sample content components for demonstrations
const SampleCard = ({ title, content }: { title: string; content: string }) => (
  <Card className="p-4">
    <h3 className="font-heading font-bold text-primary mb-2">{title}</h3>
    <p className="text-accent text-sm">{content}</p>
  </Card>
)

const SampleEvent = ({ title, date }: { title: string; date: string }) => (
  <Card variant="interactive" className="p-4">
    <h3 className="font-heading font-bold text-primary mb-1">{title}</h3>
    <p className="text-accent text-sm">{date}</p>
    <div className="mt-3 flex gap-2">
      <span className="px-2 py-1 bg-secondary/10 text-secondary rounded text-xs">
        5K
      </span>
      <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
        Beginner
      </span>
    </div>
  </Card>
)

const SampleClub = ({
  name,
  description,
}: {
  name: string
  description: string
}) => (
  <Card variant="interactive" className="p-6 border-l-4 border-l-primary">
    <h3 className="font-heading font-bold text-primary mb-2">{name}</h3>
    <p className="text-accent text-sm mb-4">{description}</p>
    <div className="flex items-center gap-2 text-xs text-accent">
      <span>📅 12 upcoming events</span>
    </div>
  </Card>
)

export const Default: Story = {
  args: {
    children: (
      <>
        <SampleCard
          title="Card 1"
          content="This is the first card in the grid."
        />
        <SampleCard
          title="Card 2"
          content="This is the second card in the grid."
        />
        <SampleCard
          title="Card 3"
          content="This is the third card in the grid."
        />
      </>
    ),
  },
}

export const ResponsiveColumns: Story = {
  args: {
    cols: { default: 1, sm: 2, md: 3, lg: 4 },
    gap: 'lg',
    children: (
      <>
        <SampleCard
          title="Responsive 1"
          content="Mobile: 1 col, Tablet: 2 cols, Desktop: 3 cols, Large: 4 cols"
        />
        <SampleCard
          title="Responsive 2"
          content="The grid automatically adjusts based on screen size."
        />
        <SampleCard
          title="Responsive 3"
          content="This provides a consistent experience across devices."
        />
        <SampleCard
          title="Responsive 4"
          content="Perfect for Quebec.run's responsive design."
        />
        <SampleCard
          title="Responsive 5"
          content="Each breakpoint can have different column counts."
        />
        <SampleCard
          title="Responsive 6"
          content="Mobile-first approach ensures accessibility."
        />
      </>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Responsive grid that adapts to different screen sizes. Resize the viewport to see the grid change from 1 column on mobile to 4 columns on large screens.',
      },
    },
  },
}

export const DifferentGaps: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="font-heading font-bold mb-4">Gap: none</h3>
        <ResponsiveGrid cols={{ default: 3 }} gap="none">
          <SampleCard title="No Gap 1" content="Cards touch each other" />
          <SampleCard title="No Gap 2" content="No spacing between items" />
          <SampleCard title="No Gap 3" content="Compact layout" />
        </ResponsiveGrid>
      </div>

      <div>
        <h3 className="font-heading font-bold mb-4">Gap: sm</h3>
        <ResponsiveGrid cols={{ default: 3 }} gap="sm">
          <SampleCard
            title="Small Gap 1"
            content="Small spacing between cards"
          />
          <SampleCard title="Small Gap 2" content="16px gap (1rem)" />
          <SampleCard title="Small Gap 3" content="Good for dense layouts" />
        </ResponsiveGrid>
      </div>

      <div>
        <h3 className="font-heading font-bold mb-4">Gap: lg</h3>
        <ResponsiveGrid cols={{ default: 3 }} gap="lg">
          <SampleCard title="Large Gap 1" content="Generous spacing" />
          <SampleCard title="Large Gap 2" content="32px gap (2rem)" />
          <SampleCard title="Large Gap 3" content="Breathable layout" />
        </ResponsiveGrid>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Different gap sizes available: none, xs (8px), sm (16px), md (24px), lg (32px), xl (48px). Choose based on your design needs and content density.',
      },
    },
  },
}

export const WithGridItems: Story = {
  render: () => (
    <ResponsiveGrid cols={{ default: 12 }} gap="md">
      <GridItem span={{ default: 12, md: 8 }}>
        <SampleCard
          title="Main Content"
          content="This spans 12 columns on mobile and 8 columns on desktop (2/3 width)"
        />
      </GridItem>
      <GridItem span={{ default: 12, md: 4 }}>
        <SampleCard
          title="Sidebar"
          content="This spans 12 columns on mobile and 4 columns on desktop (1/3 width)"
        />
      </GridItem>
      <GridItem span={{ default: 6 }}>
        <SampleCard
          title="Half Width 1"
          content="Always 6 columns (half width)"
        />
      </GridItem>
      <GridItem span={{ default: 6 }}>
        <SampleCard
          title="Half Width 2"
          content="Always 6 columns (half width)"
        />
      </GridItem>
    </ResponsiveGrid>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Use GridItem components to control how items span across columns. Perfect for creating complex layouts like main content + sidebar.',
      },
    },
  },
}

export const TwoColumn: Story = {
  render: () => (
    <TwoColumnGrid gap="lg">
      <SampleCard
        title="Column 1"
        content="Mobile: stacked, Desktop: side by side"
      />
      <SampleCard
        title="Column 2"
        content="Perfect for comparison layouts or content pairs"
      />
      <SampleCard
        title="Column 3"
        content="Additional items flow to the next row"
      />
      <SampleCard
        title="Column 4"
        content="Maintains the 2-column layout on desktop"
      />
    </TwoColumnGrid>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Convenience component for two-column layouts. Mobile: 1 column, Desktop: 2 columns.',
      },
    },
  },
}

export const ThreeColumn: Story = {
  render: () => (
    <ThreeColumnGrid gap="md">
      <SampleCard title="Feature 1" content="Mobile: 1 column" />
      <SampleCard title="Feature 2" content="Tablet: 2 columns" />
      <SampleCard title="Feature 3" content="Desktop: 3 columns" />
      <SampleCard
        title="Feature 4"
        content="Responsive across all breakpoints"
      />
      <SampleCard title="Feature 5" content="Perfect for feature showcases" />
      <SampleCard
        title="Feature 6"
        content="Consistent spacing and alignment"
      />
    </ThreeColumnGrid>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Convenience component for three-column layouts. Mobile: 1 column, Tablet: 2 columns, Desktop: 3 columns.',
      },
    },
  },
}

export const EventGridExample: Story = {
  render: () => (
    <EventGrid gap="lg">
      <SampleEvent title="Morning 5K Run" date="Thu, Sep 4 • 06:00" />
      <SampleEvent title="Trail Running Adventure" date="Fri, Sep 5 • 18:30" />
      <SampleEvent title="Marathon Training" date="Sat, Sep 6 • 07:00" />
      <SampleEvent title="Beginner's Run Club" date="Sun, Sep 7 • 09:00" />
      <SampleEvent title="Hill Repeats Training" date="Mon, Sep 8 • 17:00" />
      <SampleEvent title="Recovery Run" date="Tue, Sep 9 • 06:30" />
    </EventGrid>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Specialized grid for EventCard components. Optimized spacing and responsive breakpoints for event listings.',
      },
    },
  },
}

export const ClubGridExample: Story = {
  render: () => (
    <ClubGrid gap="lg">
      <SampleClub
        name="Quebec Running Club"
        description="Join Quebec's premier running community. We offer training programs for all levels, from beginners to competitive athletes."
      />
      <SampleClub
        name="Mountain Trail Runners"
        description="Explore the beautiful trails around Quebec City. Weekly trail runs, technique workshops, and adventure races."
      />
      <SampleClub
        name="Urban Runners QC"
        description="City running group focused on urban routes, speed work, and marathon training. Meet in Old Quebec every Tuesday and Thursday."
      />
      <SampleClub
        name="Women's Running Circle"
        description="Supportive community for women runners of all abilities. Safe group runs, fitness challenges, and social events."
      />
    </ClubGrid>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Specialized grid for ClubCard components. Gives clubs more space to display information with a 1-column mobile, 2-column desktop layout.',
      },
    },
  },
}

export const DashboardLayout: Story = {
  render: () => (
    <DashboardGrid gap="lg">
      <DashboardMain className="space-y-6">
        <Card className="p-6">
          <h2 className="font-heading font-bold text-xl text-primary mb-4">
            Dashboard Overview
          </h2>
          <p className="text-accent mb-4">
            Welcome to your Quebec.run dashboard. Here&apos;s your activity
            summary.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-primary/10 rounded-lg">
              <h3 className="font-heading font-bold text-primary">12</h3>
              <p className="text-accent text-sm">Runs This Month</p>
            </div>
            <div className="p-4 bg-secondary/10 rounded-lg">
              <h3 className="font-heading font-bold text-secondary">45.2K</h3>
              <p className="text-accent text-sm">Total Distance</p>
            </div>
            <div className="p-4 bg-accent/10 rounded-lg">
              <h3 className="font-heading font-bold text-accent">3</h3>
              <p className="text-accent text-sm">Clubs Joined</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-heading font-bold text-primary mb-4">
            Recent Activity
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <div>
                <p className="text-accent font-medium">
                  Completed 5K Morning Run
                </p>
                <p className="text-accent/60 text-sm">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-secondary rounded-full"></div>
              <div>
                <p className="text-accent font-medium">
                  Joined Trail Running Club
                </p>
                <p className="text-accent/60 text-sm">Yesterday</p>
              </div>
            </div>
          </div>
        </Card>
      </DashboardMain>

      <DashboardSidebar className="space-y-6">
        <Card className="p-6">
          <h3 className="font-heading font-bold text-primary mb-4">
            Quick Stats
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-accent text-sm">This Week</p>
              <p className="font-heading font-bold text-primary">15.4 km</p>
            </div>
            <div>
              <p className="text-accent text-sm">Average Pace</p>
              <p className="font-heading font-bold text-secondary">5:30 /km</p>
            </div>
            <div>
              <p className="text-accent text-sm">Next Event</p>
              <p className="font-heading font-bold text-accent">
                Trail Run - Tomorrow
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-heading font-bold text-primary mb-4">
            Upcoming Events
          </h3>
          <div className="space-y-3">
            <div className="p-3 border border-gray-200 rounded-lg">
              <p className="font-medium text-accent text-sm">Morning 5K</p>
              <p className="text-accent/60 text-xs">Thu, 06:00</p>
            </div>
            <div className="p-3 border border-gray-200 rounded-lg">
              <p className="font-medium text-accent text-sm">Trail Adventure</p>
              <p className="text-accent/60 text-xs">Sat, 08:00</p>
            </div>
          </div>
        </Card>
      </DashboardSidebar>
    </DashboardGrid>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story:
          'Complete dashboard layout using DashboardGrid, DashboardMain, and DashboardSidebar. Mobile: stacked layout, Desktop: 2/3 main + 1/3 sidebar.',
      },
    },
  },
}

export const ComplexResponsive: Story = {
  render: () => (
    <div className="space-y-8">
      <ResponsiveGrid
        cols={{ default: 1, sm: 2, md: 4, lg: 6, xl: 12 }}
        gap="sm"
      >
        <GridItem span={{ default: 1, sm: 2, md: 4, lg: 6, xl: 12 }}>
          <Card className="p-4 bg-primary/10">
            <h3 className="font-heading font-bold text-primary">
              Full Width Header
            </h3>
            <p className="text-accent text-sm">Always spans full width</p>
          </Card>
        </GridItem>

        <GridItem span={{ default: 1, sm: 1, md: 2, lg: 3, xl: 8 }}>
          <Card className="p-4">
            <h3 className="font-heading font-bold text-primary">
              Main Content
            </h3>
            <p className="text-accent text-sm">Responsive main content area</p>
          </Card>
        </GridItem>

        <GridItem span={{ default: 1, sm: 1, md: 2, lg: 3, xl: 4 }}>
          <Card className="p-4">
            <h3 className="font-heading font-bold text-secondary">Sidebar</h3>
            <p className="text-accent text-sm">Responsive sidebar area</p>
          </Card>
        </GridItem>
      </ResponsiveGrid>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Complex responsive layout demonstrating how grid columns and item spans work together across all breakpoints.',
      },
    },
  },
}
