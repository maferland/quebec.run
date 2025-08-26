import type { Meta, StoryObj } from '@storybook/nextjs'
import { ContentGrid } from './content-grid'

const meta = {
  title: 'UI/ContentGrid',
  component: ContentGrid,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Responsive content grid for displaying cards, items, or content blocks with consistent spacing and responsive breakpoints.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    columns: {
      description: 'Number of columns at different breakpoints',
      control: 'select',
      options: ['auto', '2', '3', '4'],
    },
    gap: {
      description: 'Spacing between grid items',
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
} satisfies Meta<typeof ContentGrid>

export default meta
type Story = StoryObj<typeof meta>

// Mock content components for demonstration
const MockCard = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-white p-6 rounded-xl border shadow-sm">{children}</div>
)

// Basic Examples
export const Default: Story = {
  args: {
    children: (
      <>
        <MockCard>Card 1</MockCard>
        <MockCard>Card 2</MockCard>
        <MockCard>Card 3</MockCard>
        <MockCard>Card 4</MockCard>
        <MockCard>Card 5</MockCard>
        <MockCard>Card 6</MockCard>
      </>
    ),
  },
}

// Column Variations
export const TwoColumns: Story = {
  args: {
    columns: '2',
    children: (
      <>
        <MockCard>
          <h3 className="font-semibold mb-2">Feature A</h3>
          <p className="text-sm text-gray-600">Description for feature A</p>
        </MockCard>
        <MockCard>
          <h3 className="font-semibold mb-2">Feature B</h3>
          <p className="text-sm text-gray-600">Description for feature B</p>
        </MockCard>
        <MockCard>
          <h3 className="font-semibold mb-2">Feature C</h3>
          <p className="text-sm text-gray-600">Description for feature C</p>
        </MockCard>
        <MockCard>
          <h3 className="font-semibold mb-2">Feature D</h3>
          <p className="text-sm text-gray-600">Description for feature D</p>
        </MockCard>
      </>
    ),
  },
}

export const FourColumns: Story = {
  args: {
    columns: '4',
    children: (
      <>
        {Array.from({ length: 8 }, (_, i) => (
          <MockCard key={i}>
            <div className="text-center">
              <div className="w-8 h-8 bg-primary rounded-full mx-auto mb-2" />
              <h4 className="font-medium">Item {i + 1}</h4>
            </div>
          </MockCard>
        ))}
      </>
    ),
  },
}

// Gap Variations
export const SmallGap: Story = {
  args: {
    gap: 'sm',
    children: (
      <>
        <MockCard>Small gap</MockCard>
        <MockCard>Between cards</MockCard>
        <MockCard>Compact layout</MockCard>
        <MockCard>Perfect for dense content</MockCard>
      </>
    ),
  },
}

export const LargeGap: Story = {
  args: {
    gap: 'lg',
    children: (
      <>
        <MockCard>Large gap</MockCard>
        <MockCard>Between cards</MockCard>
        <MockCard>Spacious layout</MockCard>
        <MockCard>Perfect for featured content</MockCard>
      </>
    ),
  },
}

// Real-world Examples
export const EventCards: Story = {
  render: () => (
    <ContentGrid>
      {Array.from({ length: 6 }, (_, i) => (
        <MockCard key={i}>
          <div className="flex items-start gap-3 mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-primary mb-1">
                Morning Run #{i + 1}
              </h3>
              <p className="text-xs text-gray-500">Quebec Running Club</p>
            </div>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
              Dec {i + 1} • 07:00
            </span>
          </div>
          <div className="flex gap-2 mb-3">
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
              5K
            </span>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
              Easy pace
            </span>
          </div>
          <p className="text-sm text-gray-600">
            Plains of Abraham Park, Quebec City
          </p>
        </MockCard>
      ))}
    </ContentGrid>
  ),
}

export const ClubCards: Story = {
  render: () => (
    <ContentGrid>
      {Array.from({ length: 4 }, (_, i) => (
        <MockCard key={i}>
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <span className="text-primary font-bold text-sm">{i + 1}</span>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-primary mb-1">Club {i + 1}</h3>
              <p className="text-xs text-gray-500">Quebec City</p>
            </div>
            <span className="text-xs bg-secondary/10 text-secondary px-2 py-1 rounded-full">
              {Math.floor(Math.random() * 10) + 1}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Join us for regular running activities and community events in
            Quebec City.
          </p>
          <div className="space-y-2">
            <div className="bg-gray-50 p-2 rounded text-xs">
              <strong>Next run:</strong> Tomorrow at 7:00 AM
            </div>
            <div className="bg-gray-50 p-2 rounded text-xs">
              <strong>Distance:</strong> 5K - 10K routes
            </div>
          </div>
        </MockCard>
      ))}
    </ContentGrid>
  ),
}

// Responsive Demonstration
export const ResponsiveDemo: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">
          Auto Layout (1 → 2 → 3 columns)
        </h3>
        <ContentGrid columns="auto">
          {Array.from({ length: 6 }, (_, i) => (
            <MockCard key={i}>
              <div className="text-center">
                <div className="text-2xl mb-2">📱→💻→🖥️</div>
                <p className="text-sm">Responsive card {i + 1}</p>
              </div>
            </MockCard>
          ))}
        </ContentGrid>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">
          4 Column Layout (1 → 2 → 3 → 4 columns)
        </h3>
        <ContentGrid columns="4" gap="sm">
          {Array.from({ length: 8 }, (_, i) => (
            <MockCard key={i}>
              <div className="text-center">
                <div className="text-xl mb-1">🎯</div>
                <p className="text-xs">Item {i + 1}</p>
              </div>
            </MockCard>
          ))}
        </ContentGrid>
      </div>
    </div>
  ),
}
