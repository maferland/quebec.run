import { describe, it, expect } from 'vitest'
import { render, screen } from '@/lib/test-utils'
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

describe('ResponsiveGrid Component', () => {
  it('renders with default single column', () => {
    const { container } = render(
      <ResponsiveGrid>
        <div>Item 1</div>
        <div>Item 2</div>
      </ResponsiveGrid>
    )

    expect(container.firstChild).toHaveClass('grid', 'grid-cols-1', 'gap-6')
    expect(screen.getByText('Item 1')).toBeInTheDocument()
    expect(screen.getByText('Item 2')).toBeInTheDocument()
  })

  it('applies responsive column classes correctly', () => {
    const { container } = render(
      <ResponsiveGrid
        cols={{ default: 1, sm: 2, md: 3, lg: 4, xl: 6 }}
        gap="lg"
      >
        <div>Item</div>
      </ResponsiveGrid>
    )

    const gridElement = container.firstChild as HTMLElement
    expect(gridElement).toHaveClass(
      'grid',
      'grid-cols-1',
      'sm:grid-cols-2',
      'md:grid-cols-3',
      'lg:grid-cols-4',
      'xl:grid-cols-6',
      'gap-8'
    )
  })

  it('applies different gap sizes correctly', () => {
    const gaps = [
      { gap: 'none' as const, expected: 'gap-0' },
      { gap: 'xs' as const, expected: 'gap-2' },
      { gap: 'sm' as const, expected: 'gap-4' },
      { gap: 'md' as const, expected: 'gap-6' },
      { gap: 'lg' as const, expected: 'gap-8' },
      { gap: 'xl' as const, expected: 'gap-12' },
    ]

    gaps.forEach(({ gap, expected }) => {
      const { container } = render(
        <ResponsiveGrid gap={gap}>
          <div>Item</div>
        </ResponsiveGrid>
      )

      expect(container.firstChild).toHaveClass(expected)
    })
  })

  it('merges custom className with grid classes', () => {
    const { container } = render(
      <ResponsiveGrid className="custom-grid-class">
        <div>Item</div>
      </ResponsiveGrid>
    )

    expect(container.firstChild).toHaveClass(
      'custom-grid-class',
      'grid',
      'grid-cols-1'
    )
  })

  it('handles all column configurations', () => {
    const columns = [1, 2, 3, 4, 5, 6, 12] as const

    columns.forEach((col) => {
      const { container } = render(
        <ResponsiveGrid cols={{ default: col }}>
          <div>Item</div>
        </ResponsiveGrid>
      )

      expect(container.firstChild).toHaveClass(`grid-cols-${col}`)
    })
  })
})

describe('GridItem Component', () => {
  it('renders with default single column span', () => {
    const { container } = render(
      <GridItem>
        <div>Content</div>
      </GridItem>
    )

    expect(container.firstChild).toHaveClass('col-span-1')
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('applies responsive span classes correctly', () => {
    const { container } = render(
      <GridItem span={{ default: 12, sm: 6, md: 4, lg: 3, xl: 2 }}>
        <div>Content</div>
      </GridItem>
    )

    const itemElement = container.firstChild as HTMLElement
    expect(itemElement).toHaveClass(
      'col-span-12',
      'sm:col-span-6',
      'md:col-span-4',
      'lg:col-span-3',
      'xl:col-span-2'
    )
  })

  it('merges custom className with span classes', () => {
    const { container } = render(
      <GridItem span={{ default: 6 }} className="custom-item-class">
        <div>Content</div>
      </GridItem>
    )

    expect(container.firstChild).toHaveClass('custom-item-class', 'col-span-6')
  })

  it('handles all span configurations', () => {
    const spans = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const

    spans.forEach((span) => {
      const { container } = render(
        <GridItem span={{ default: span }}>
          <div>Content</div>
        </GridItem>
      )

      expect(container.firstChild).toHaveClass(`col-span-${span}`)
    })
  })
})

describe('Convenience Grid Components', () => {
  describe('TwoColumnGrid', () => {
    it('renders with correct responsive columns', () => {
      const { container } = render(
        <TwoColumnGrid>
          <div>Item 1</div>
          <div>Item 2</div>
        </TwoColumnGrid>
      )

      expect(container.firstChild).toHaveClass(
        'grid',
        'grid-cols-1',
        'md:grid-cols-2'
      )
    })

    it('applies custom gap and className', () => {
      const { container } = render(
        <TwoColumnGrid gap="sm" className="custom-two-col">
          <div>Item</div>
        </TwoColumnGrid>
      )

      expect(container.firstChild).toHaveClass('gap-4', 'custom-two-col')
    })
  })

  describe('ThreeColumnGrid', () => {
    it('renders with correct responsive columns', () => {
      const { container } = render(
        <ThreeColumnGrid>
          <div>Item 1</div>
          <div>Item 2</div>
          <div>Item 3</div>
        </ThreeColumnGrid>
      )

      expect(container.firstChild).toHaveClass(
        'grid',
        'grid-cols-1',
        'sm:grid-cols-2',
        'lg:grid-cols-3'
      )
    })
  })

  describe('EventGrid', () => {
    it('renders with event-optimized layout', () => {
      const { container } = render(
        <EventGrid>
          <div>Event 1</div>
          <div>Event 2</div>
          <div>Event 3</div>
        </EventGrid>
      )

      expect(container.firstChild).toHaveClass(
        'grid',
        'grid-cols-1',
        'md:grid-cols-2',
        'lg:grid-cols-3',
        'gap-8',
        'w-full'
      )
    })

    it('applies custom className while preserving w-full', () => {
      const { container } = render(
        <EventGrid className="custom-event-grid">
          <div>Event</div>
        </EventGrid>
      )

      expect(container.firstChild).toHaveClass('w-full', 'custom-event-grid')
    })
  })

  describe('ClubGrid', () => {
    it('renders with club-optimized layout', () => {
      const { container } = render(
        <ClubGrid>
          <div>Club 1</div>
          <div>Club 2</div>
        </ClubGrid>
      )

      expect(container.firstChild).toHaveClass(
        'grid',
        'grid-cols-1',
        'lg:grid-cols-2',
        'gap-8',
        'w-full'
      )
    })
  })

  describe('DashboardGrid', () => {
    it('renders with dashboard layout', () => {
      const { container } = render(
        <DashboardGrid>
          <div>Content</div>
        </DashboardGrid>
      )

      expect(container.firstChild).toHaveClass(
        'grid',
        'grid-cols-1',
        'lg:grid-cols-12',
        'gap-8',
        'w-full',
        'min-h-screen'
      )
    })
  })

  describe('DashboardMain', () => {
    it('renders with main content span', () => {
      const { container } = render(
        <DashboardMain>
          <div>Main Content</div>
        </DashboardMain>
      )

      expect(container.firstChild).toHaveClass('col-span-1', 'lg:col-span-8')
      expect(screen.getByText('Main Content')).toBeInTheDocument()
    })

    it('applies custom className', () => {
      const { container } = render(
        <DashboardMain className="main-custom">
          <div>Content</div>
        </DashboardMain>
      )

      expect(container.firstChild).toHaveClass('main-custom')
    })
  })

  describe('DashboardSidebar', () => {
    it('renders with sidebar span', () => {
      const { container } = render(
        <DashboardSidebar>
          <div>Sidebar Content</div>
        </DashboardSidebar>
      )

      expect(container.firstChild).toHaveClass('col-span-1', 'lg:col-span-4')
      expect(screen.getByText('Sidebar Content')).toBeInTheDocument()
    })

    it('applies custom className', () => {
      const { container } = render(
        <DashboardSidebar className="sidebar-custom">
          <div>Content</div>
        </DashboardSidebar>
      )

      expect(container.firstChild).toHaveClass('sidebar-custom')
    })
  })
})

describe('Grid Integration Tests', () => {
  it('combines ResponsiveGrid with GridItem correctly', () => {
    const { container } = render(
      <ResponsiveGrid cols={{ default: 12 }} gap="md">
        <GridItem span={{ default: 8 }}>
          <div>Main Content</div>
        </GridItem>
        <GridItem span={{ default: 4 }}>
          <div>Sidebar</div>
        </GridItem>
      </ResponsiveGrid>
    )

    const grid = container.firstChild as HTMLElement
    expect(grid).toHaveClass('grid', 'grid-cols-12', 'gap-6')

    const [mainItem, sidebarItem] = Array.from(grid.children)
    expect(mainItem).toHaveClass('col-span-8')
    expect(sidebarItem).toHaveClass('col-span-4')
  })

  it('creates complex responsive layouts', () => {
    const { container } = render(
      <ResponsiveGrid cols={{ default: 1, md: 2, xl: 4 }} gap="lg">
        <div>Card 1</div>
        <div>Card 2</div>
        <div>Card 3</div>
        <div>Card 4</div>
      </ResponsiveGrid>
    )

    expect(container.firstChild).toHaveClass(
      'grid',
      'grid-cols-1',
      'md:grid-cols-2',
      'xl:grid-cols-4',
      'gap-8'
    )
  })
})

describe('Real-world Usage Patterns', () => {
  it('renders event listing layout', () => {
    const { container } = render(
      <EventGrid>
        <div data-testid="event-1">Marathon Training</div>
        <div data-testid="event-2">5K Fun Run</div>
        <div data-testid="event-3">Trail Running</div>
      </EventGrid>
    )

    expect(container.firstChild).toHaveClass(
      'grid',
      'grid-cols-1',
      'md:grid-cols-2',
      'lg:grid-cols-3'
    )
    expect(screen.getByTestId('event-1')).toBeInTheDocument()
    expect(screen.getByTestId('event-2')).toBeInTheDocument()
    expect(screen.getByTestId('event-3')).toBeInTheDocument()
  })

  it('renders club listing layout', () => {
    const { container } = render(
      <ClubGrid>
        <div data-testid="club-1">Quebec Running Club</div>
        <div data-testid="club-2">Mountain Trail Runners</div>
      </ClubGrid>
    )

    expect(container.firstChild).toHaveClass(
      'grid',
      'grid-cols-1',
      'lg:grid-cols-2'
    )
    expect(screen.getByTestId('club-1')).toBeInTheDocument()
    expect(screen.getByTestId('club-2')).toBeInTheDocument()
  })

  it('renders dashboard layout with main and sidebar', () => {
    render(
      <DashboardGrid>
        <DashboardMain>
          <h1>Dashboard Content</h1>
          <p>Main area content goes here</p>
        </DashboardMain>
        <DashboardSidebar>
          <h2>Quick Stats</h2>
          <p>Sidebar content goes here</p>
        </DashboardSidebar>
      </DashboardGrid>
    )

    expect(screen.getByText('Dashboard Content')).toBeInTheDocument()
    expect(screen.getByText('Main area content goes here')).toBeInTheDocument()
    expect(screen.getByText('Quick Stats')).toBeInTheDocument()
    expect(screen.getByText('Sidebar content goes here')).toBeInTheDocument()
  })

  it('handles responsive behavior for different screen sizes', () => {
    const { container } = render(
      <ResponsiveGrid
        cols={{ default: 1, sm: 2, md: 3, lg: 4, xl: 6 }}
        gap="md"
        className="responsive-test"
      >
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i}>Item {i + 1}</div>
        ))}
      </ResponsiveGrid>
    )

    const grid = container.firstChild as HTMLElement
    expect(grid).toHaveClass(
      'responsive-test',
      'grid-cols-1',
      'sm:grid-cols-2',
      'md:grid-cols-3',
      'lg:grid-cols-4',
      'xl:grid-cols-6'
    )
  })
})
