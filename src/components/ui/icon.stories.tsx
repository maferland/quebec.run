import type { Meta, StoryObj } from '@storybook/nextjs'
import {
  MapPin,
  Calendar,
  Users,
  Clock,
  Search,
  Filter,
  Star,
  Heart,
  Settings,
  Home,
} from 'lucide-react'
import { Icon } from './icon'

const meta = {
  title: 'UI/Icon',
  component: Icon,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Icon component wrapper providing consistent sizing and theming for Lucide icons in the Quebec.run design system.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    icon: {
      description: 'Lucide icon component to render',
      control: false,
    },
    size: {
      description: 'Semantic size for consistent visual hierarchy',
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'],
    },
    color: {
      description: 'Semantic color from Quebec.run design system',
      control: 'select',
      options: [
        'current',
        'primary',
        'secondary',
        'accent',
        'text-primary',
        'text-secondary',
        'text-tertiary',
        'text-inverse',
        'success',
        'warning',
        'error',
        'info',
        'muted',
      ],
    },
    decorative: {
      description: 'Whether icon is decorative (hidden from screen readers)',
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Icon>

export default meta
type Story = StoryObj<typeof meta>

// Basic Examples
export const Default: Story = {
  args: {
    icon: MapPin,
  },
}

export const WithLabel: Story = {
  args: {
    icon: Calendar,
    'aria-label': 'Calendar event',
  },
}

export const Decorative: Story = {
  args: {
    icon: Star,
    decorative: true,
  },
}

// Size Variants
export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <div className="text-center">
        <Icon icon={Users} size="xs" />
        <p className="text-xs mt-2 text-text-secondary">xs (12px)</p>
      </div>
      <div className="text-center">
        <Icon icon={Users} size="sm" />
        <p className="text-xs mt-2 text-text-secondary">sm (16px)</p>
      </div>
      <div className="text-center">
        <Icon icon={Users} size="md" />
        <p className="text-xs mt-2 text-text-secondary">md (20px)</p>
      </div>
      <div className="text-center">
        <Icon icon={Users} size="lg" />
        <p className="text-xs mt-2 text-text-secondary">lg (24px)</p>
      </div>
      <div className="text-center">
        <Icon icon={Users} size="xl" />
        <p className="text-xs mt-2 text-text-secondary">xl (32px)</p>
      </div>
      <div className="text-center">
        <Icon icon={Users} size="2xl" />
        <p className="text-xs mt-2 text-text-secondary">2xl (48px)</p>
      </div>
      <div className="text-center">
        <Icon icon={Users} size="3xl" />
        <p className="text-xs mt-2 text-text-secondary">3xl (64px)</p>
      </div>
    </div>
  ),
}

// Color Variants
export const QuebecRunBrandColors: Story = {
  render: () => (
    <div className="flex gap-6">
      <div className="text-center">
        <Icon icon={MapPin} color="primary" size="xl" />
        <p className="text-sm mt-2 text-text-primary font-medium">Primary</p>
        <p className="text-xs text-text-secondary">#302BFF</p>
      </div>
      <div className="text-center">
        <Icon icon={Heart} color="secondary" size="xl" />
        <p className="text-sm mt-2 text-text-primary font-medium">Secondary</p>
        <p className="text-xs text-text-secondary">#FF298F</p>
      </div>
      <div className="text-center">
        <Icon icon={Settings} color="accent" size="xl" />
        <p className="text-sm mt-2 text-text-primary font-medium">Accent</p>
        <p className="text-xs text-text-secondary">#505060</p>
      </div>
    </div>
  ),
}

export const TextColors: Story = {
  render: () => (
    <div className="flex gap-6">
      <div className="text-center">
        <Icon icon={Home} color="text-primary" size="lg" />
        <p className="text-sm mt-2">Primary Text</p>
      </div>
      <div className="text-center">
        <Icon icon={Calendar} color="text-secondary" size="lg" />
        <p className="text-sm mt-2">Secondary Text</p>
      </div>
      <div className="text-center">
        <Icon icon={Clock} color="text-tertiary" size="lg" />
        <p className="text-sm mt-2">Tertiary Text</p>
      </div>
      <div className="text-center bg-primary p-4 rounded-lg">
        <Icon icon={Star} color="text-inverse" size="lg" />
        <p className="text-sm mt-2 text-text-inverse">Inverse Text</p>
      </div>
    </div>
  ),
}

export const StatusColors: Story = {
  render: () => (
    <div className="flex gap-6">
      <div className="text-center">
        <Icon icon={Star} color="success" size="lg" />
        <p className="text-sm mt-2">Success</p>
      </div>
      <div className="text-center">
        <Icon icon={Clock} color="warning" size="lg" />
        <p className="text-sm mt-2">Warning</p>
      </div>
      <div className="text-center">
        <Icon icon={Filter} color="error" size="lg" />
        <p className="text-sm mt-2">Error</p>
      </div>
      <div className="text-center">
        <Icon icon={Search} color="info" size="lg" />
        <p className="text-sm mt-2">Info</p>
      </div>
      <div className="text-center">
        <Icon icon={Settings} color="muted" size="lg" />
        <p className="text-sm mt-2">Muted</p>
      </div>
    </div>
  ),
}

// Usage Examples
export const NavigationIcons: Story = {
  render: () => (
    <div className="flex items-center gap-4 p-4 bg-surface rounded-lg border border-border">
      <Icon icon={Home} size="md" color="text-secondary" aria-label="Home" />
      <Icon
        icon={Calendar}
        size="md"
        color="text-secondary"
        aria-label="Events"
      />
      <Icon icon={Users} size="md" color="text-secondary" aria-label="Clubs" />
      <Icon
        icon={Search}
        size="md"
        color="text-secondary"
        aria-label="Search"
      />
    </div>
  ),
}

export const ButtonWithIcon: Story = {
  render: () => (
    <button className="flex items-center gap-2 px-4 py-2 bg-primary text-text-inverse rounded-lg hover:bg-primary/90 transition-colors">
      <Icon icon={Calendar} size="sm" color="text-inverse" decorative />
      <span>Find Events</span>
    </button>
  ),
}

export const HeroIcon: Story = {
  render: () => (
    <div className="text-center p-12 bg-surface-variant rounded-xl">
      <Icon
        icon={MapPin}
        size="3xl"
        color="primary"
        aria-label="Location services"
      />
      <h2 className="text-2xl font-heading font-bold text-text-primary mt-4 mb-2">
        Interactive Map
      </h2>
      <p className="text-text-secondary max-w-sm">
        Explore routes and locations across Quebec City with our interactive
        mapping feature.
      </p>
    </div>
  ),
}

export const FlexLayoutBehavior: Story = {
  render: () => (
    <div className="space-y-4 max-w-md">
      <p className="text-sm text-text-secondary mb-4">
        Icons include{' '}
        <code className="bg-surface-secondary px-1 rounded">flex-shrink-0</code>{' '}
        to prevent distortion in flex layouts:
      </p>

      <div className="flex items-center gap-2 p-3 bg-surface border border-border rounded-lg">
        <Icon icon={MapPin} size="sm" color="primary" decorative />
        <span className="text-sm">
          This is a very long text that might wrap to multiple lines and could
          potentially cause layout issues, but the icon maintains its size
        </span>
      </div>

      <div className="flex items-start gap-3 p-3 bg-surface border border-border rounded-lg">
        <Icon icon={Calendar} size="md" color="secondary" decorative />
        <div>
          <h4 className="font-medium text-text-primary">Event Title</h4>
          <p className="text-sm text-text-secondary">
            Even with multiline content, the icon stays properly sized and
            positioned at the top.
          </p>
        </div>
      </div>
    </div>
  ),
}

// Interactive Examples
export const InteractiveSize: Story = {
  args: {
    icon: Star,
    size: 'lg',
    color: 'primary',
  },
}

export const InteractiveColor: Story = {
  args: {
    icon: Heart,
    size: 'xl',
    color: 'secondary',
  },
}
