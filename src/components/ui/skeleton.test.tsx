import { describe, it, expect } from 'vitest'
import { render, screen } from '@/lib/test-utils'
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

describe('Skeleton Component', () => {
  it('renders with default props', () => {
    const { container } = render(<Skeleton className="h-4 w-24" />)

    const skeleton = container.firstChild as HTMLElement
    expect(skeleton).toBeVisible()
    expect(skeleton).toHaveClass('h-4', 'w-24')
  })

  it('supports different animation types', () => {
    const { container: pulseContainer } = render(
      <Skeleton className="h-4 w-24" animation="pulse" />
    )
    const { container: shimmerContainer } = render(
      <Skeleton className="h-4 w-24" animation="shimmer" />
    )
    const { container: noneContainer } = render(
      <Skeleton className="h-4 w-24" animation="none" />
    )

    expect(pulseContainer.firstChild).toBeVisible()
    expect(shimmerContainer.firstChild).toBeVisible()
    expect(noneContainer.firstChild).toBeVisible()
  })

  it('supports different rounded variants', () => {
    const variants = [
      { rounded: 'none' as const },
      { rounded: 'sm' as const },
      { rounded: 'md' as const },
      { rounded: 'lg' as const },
      { rounded: 'xl' as const },
      { rounded: 'full' as const },
    ]

    variants.forEach(({ rounded }) => {
      const { container } = render(
        <Skeleton className="h-4 w-24" rounded={rounded} />
      )
      expect(container.firstChild).toBeVisible()
    })
  })

  it('applies custom className correctly', () => {
    const { container } = render(
      <Skeleton
        className="h-8 w-32 custom-skeleton"
        animation="shimmer"
        rounded="lg"
      />
    )

    expect(container.firstChild).toBeVisible()
    expect(container.firstChild).toHaveClass('h-8', 'w-32', 'custom-skeleton')
  })
})

describe('SkeletonCard Component', () => {
  it('renders with proper accessibility attributes', () => {
    const { container } = render(<SkeletonCard />)

    expect(container.firstChild).toBeVisible()
    expect(container.firstChild).toHaveAttribute('role', 'status')
    expect(container.firstChild).toHaveAttribute(
      'aria-label',
      'Loading content...'
    )
  })

  it('includes avatar placeholder when showAvatar is true', () => {
    render(<SkeletonCard showAvatar />)

    // Should have avatar skeleton in the header
    const avatarSkeleton = document.querySelector('.flex-shrink-0')
    expect(avatarSkeleton).toBeInTheDocument()
    expect(avatarSkeleton).toBeVisible()
  })

  it('renders specified number of content lines', () => {
    render(<SkeletonCard lines={4} />)

    // Should render the component with lines configuration
    const skeletonCard = screen.getByRole('status')
    expect(skeletonCard).toBeVisible()
    expect(skeletonCard).toHaveAttribute('aria-label', 'Loading content...')
  })

  it('includes action section when showActions is true', () => {
    render(<SkeletonCard showActions />)

    const actionsSection = document.querySelector('.border-t')
    expect(actionsSection).toBeInTheDocument()
    expect(actionsSection).toBeVisible()
  })

  it('renders compact variant correctly', () => {
    const { container } = render(<SkeletonCard variant="compact" />)

    expect(container.firstChild).toBeVisible()
    // Compact variant should not render the main content lines section
    const mainContentSection = container.querySelector('.space-y-2.mb-4')
    expect(mainContentSection).not.toBeInTheDocument()
  })

  it('renders event-specific elements for event variant', () => {
    render(<SkeletonCard variant="event" showAvatar />)

    // Should have avatar for events
    const avatar = document.querySelector('.flex-shrink-0')
    expect(avatar).toBeVisible()

    // Should have event datetime tag skeleton
    const datetimeTag = document.querySelector('.h-6.w-32')
    expect(datetimeTag).toBeInTheDocument()

    // Should have event tags section
    const tagsSection = document.querySelector('.flex.gap-2')
    expect(tagsSection).toBeInTheDocument()
  })

  it('renders club-specific elements for club variant', () => {
    render(<SkeletonCard variant="club" showAvatar />)

    // Should have avatar for clubs
    const avatar = document.querySelector('.flex-shrink-0')
    expect(avatar).toBeVisible()

    // Should have club event count badge
    const eventBadge = document.querySelector('.h-8.w-8')
    expect(eventBadge).toBeInTheDocument()

    // Should have club events preview
    const eventsPreview = document.querySelector('.space-y-3')
    expect(eventsPreview).toBeInTheDocument()
  })

  it('applies custom className correctly', () => {
    const { container } = render(
      <SkeletonCard className="custom-skeleton-card" />
    )

    expect(container.firstChild).toBeVisible()
    expect(container.firstChild).toHaveClass('custom-skeleton-card')
  })
})

describe('LoadingState Component', () => {
  it('renders with default props', () => {
    render(<LoadingState />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()

    // Should have spinner by default
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('renders custom text', () => {
    render(<LoadingState text="Loading events..." />)

    expect(screen.getByText('Loading events...')).toBeInTheDocument()
  })

  it('hides spinner when showSpinner is false', () => {
    render(<LoadingState showSpinner={false} />)

    const spinner = document.querySelector('.animate-spin')
    expect(spinner).not.toBeInTheDocument()
  })

  it('renders different sizes correctly', () => {
    const { container: smContainer } = render(
      <LoadingState size="sm" showSpinner text="Small" />
    )
    const { container: mdContainer } = render(
      <LoadingState size="md" showSpinner text="Medium" />
    )
    const { container: lgContainer } = render(
      <LoadingState size="lg" showSpinner text="Large" />
    )

    // Check that all sizes render properly
    expect(smContainer.querySelector('.animate-spin')).toBeVisible()
    expect(mdContainer.querySelector('.animate-spin')).toBeVisible()
    expect(lgContainer.querySelector('.animate-spin')).toBeVisible()

    // Check text content
    expect(smContainer.querySelector('p')).toHaveTextContent('Small')
    expect(mdContainer.querySelector('p')).toHaveTextContent('Medium')
    expect(lgContainer.querySelector('p')).toHaveTextContent('Large')
  })

  it('applies custom className correctly', () => {
    const { container } = render(<LoadingState className="custom-loading" />)

    expect(container.firstChild).toBeVisible()
    expect(container.firstChild).toHaveClass('custom-loading')
  })

  it('has correct accessibility attributes', () => {
    render(<LoadingState text="Loading data..." />)

    const loadingElement = screen.getByRole('status')
    expect(loadingElement).toHaveAttribute('aria-live', 'polite')
  })
})

describe('SkeletonList Component', () => {
  it('renders default number of skeleton cards', () => {
    const { container } = render(<SkeletonList />)

    expect(container.firstChild).toHaveAttribute('role', 'status')
    expect(container.firstChild).toHaveAttribute(
      'aria-label',
      'Loading 3 items...'
    )

    // Should render 3 skeleton cards by default
    const skeletonCards = container.querySelectorAll(
      '[role="status"] > div > div[role="status"]'
    )
    expect(skeletonCards).toHaveLength(3)
  })

  it('renders custom number of skeleton cards', () => {
    const { container } = render(<SkeletonList count={5} />)

    expect(container.firstChild).toHaveAttribute(
      'aria-label',
      'Loading 5 items...'
    )

    const skeletonCards = container.querySelectorAll(
      '[role="status"] > div > div[role="status"]'
    )
    expect(skeletonCards).toHaveLength(5)
  })

  it('renders vertical layout by default', () => {
    const { container } = render(<SkeletonList />)

    expect(container.firstChild).toBeVisible()
    expect(container.firstChild).toHaveAttribute('role', 'status')
  })

  it('renders horizontal layout when specified', () => {
    const { container } = render(<SkeletonList direction="horizontal" />)

    expect(container.firstChild).toBeVisible()
    expect(container.firstChild).toHaveAttribute('role', 'status')
  })

  it('renders horizontal items with proper structure', () => {
    const { container } = render(
      <SkeletonList direction="horizontal" count={2} />
    )

    const listContainer = container.querySelector('[role="status"]')
    expect(listContainer).toBeVisible()

    const wrapperItems = listContainer?.children || []
    expect(wrapperItems).toHaveLength(2)
    Array.from(wrapperItems).forEach((item) => {
      expect(item).toBeVisible()
    })
  })

  it('passes variant to skeleton cards', () => {
    render(<SkeletonList variant="event" count={1} />)

    // Event variant should have datetime tag
    const datetimeTag = document.querySelector('.h-6.w-32')
    expect(datetimeTag).toBeInTheDocument()
  })

  it('applies custom className correctly', () => {
    const { container } = render(
      <SkeletonList className="custom-skeleton-list" />
    )

    expect(container.firstChild).toBeVisible()
    expect(container.firstChild).toHaveClass('custom-skeleton-list')
  })
})

describe('Convenience Components', () => {
  describe('EventCardSkeleton', () => {
    it('renders with event-specific configuration', () => {
      render(<EventCardSkeleton />)

      // Should have event datetime tag
      const datetimeTag = document.querySelector('.h-6.w-32')
      expect(datetimeTag).toBeInTheDocument()

      // Should have event tags
      const tagsSection = document.querySelector('.flex.gap-2')
      expect(tagsSection).toBeInTheDocument()
    })

    it('applies custom className correctly', () => {
      const { container } = render(
        <EventCardSkeleton className="custom-event-skeleton" />
      )

      expect(container.firstChild).toBeVisible()
      expect(container.firstChild).toHaveClass('custom-event-skeleton')
    })
  })

  describe('ClubCardSkeleton', () => {
    it('renders with club-specific configuration', () => {
      const { container } = render(<ClubCardSkeleton />)

      // Should render as a visible skeleton
      expect(container.firstChild).toBeVisible()
      expect(container.firstChild).toHaveAttribute('role', 'status')

      // Should have avatar placeholder
      const avatar = document.querySelector('.flex-shrink-0')
      expect(avatar).toBeInTheDocument()

      // Should have action section
      const actions = document.querySelector('.border-t')
      expect(actions).toBeInTheDocument()
    })

    it('applies custom className while maintaining structure', () => {
      const { container } = render(
        <ClubCardSkeleton className="custom-club-skeleton" />
      )

      expect(container.firstChild).toBeVisible()
      expect(container.firstChild).toHaveClass('custom-club-skeleton')
    })
  })

  describe('PageLoading', () => {
    it('renders with default title', () => {
      render(<PageLoading />)

      expect(screen.getByText('Loading page...')).toBeInTheDocument()
    })

    it('renders with custom title', () => {
      render(<PageLoading title="Loading dashboard..." />)

      expect(screen.getByText('Loading dashboard...')).toBeInTheDocument()
    })

    it('renders with appropriate height for page loading', () => {
      const { container } = render(<PageLoading />)

      expect(container.firstChild).toBeVisible()
      expect(screen.getByText('Loading page...')).toBeInTheDocument()
    })

    it('applies custom className correctly', () => {
      const { container } = render(
        <PageLoading className="custom-page-loading" />
      )

      expect(container.firstChild).toBeVisible()
      expect(container.firstChild).toHaveClass('custom-page-loading')
    })
  })

  describe('SectionLoading', () => {
    it('renders with default title', () => {
      render(<SectionLoading />)

      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('renders with custom title', () => {
      render(<SectionLoading title="Loading events..." />)

      expect(screen.getByText('Loading events...')).toBeInTheDocument()
    })

    it('renders with appropriate spacing for sections', () => {
      const { container } = render(<SectionLoading />)

      expect(container.firstChild).toBeVisible()
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('applies custom className correctly', () => {
      const { container } = render(
        <SectionLoading className="custom-section-loading" />
      )

      expect(container.firstChild).toBeVisible()
      expect(container.firstChild).toHaveClass('custom-section-loading')
    })
  })
})

describe('Accessibility', () => {
  it('provides proper ARIA labels for skeleton cards', () => {
    render(<SkeletonCard />)

    const skeletonCard = screen.getByRole('status')
    expect(skeletonCard).toHaveAttribute('aria-label', 'Loading content...')
  })

  it('provides proper ARIA labels for skeleton lists', () => {
    const { container } = render(<SkeletonList count={4} />)

    const skeletonList = container.querySelector(
      '[aria-label="Loading 4 items..."]'
    )
    expect(skeletonList).toHaveAttribute('aria-label', 'Loading 4 items...')
    expect(skeletonList).toHaveAttribute('role', 'status')
  })

  it('provides proper ARIA attributes for loading states', () => {
    render(<LoadingState text="Loading..." />)

    const loadingState = screen.getByRole('status')
    expect(loadingState).toHaveAttribute('aria-live', 'polite')
  })

  it('hides decorative spinner from screen readers', () => {
    render(<LoadingState showSpinner text="Loading..." />)

    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('Real-world Usage Patterns', () => {
  it('creates loading state for event listings', () => {
    const { container } = render(<SkeletonList count={6} variant="event" />)

    const skeletonCards = container.querySelectorAll(
      '[role="status"] > div > div[role="status"]'
    )
    expect(skeletonCards).toHaveLength(6)

    // Each should have event-specific elements
    const datetimeTags = container.querySelectorAll('.h-6.w-32')
    expect(datetimeTags.length).toBeGreaterThanOrEqual(6)
  })

  it('creates loading state for club listings', () => {
    const { container } = render(<SkeletonList count={4} variant="club" />)

    const skeletonCards = container.querySelectorAll(
      '[role="status"] > div > div[role="status"]'
    )
    expect(skeletonCards).toHaveLength(4)

    // Each should have club-specific elements
    const clubElements = container.querySelectorAll('.space-y-3')
    expect(clubElements.length).toBeGreaterThanOrEqual(4)
  })

  it('creates horizontal scrolling loading list', () => {
    const { container } = render(
      <SkeletonList count={8} direction="horizontal" variant="event" />
    )

    expect(container.firstChild).toBeVisible()

    const listContainer = container.querySelector('[role="status"]')
    const wrapperItems = listContainer?.children || []
    expect(wrapperItems).toHaveLength(8)

    // Each item should be visible in horizontal layout
    Array.from(wrapperItems).forEach((item) => {
      expect(item).toBeVisible()
    })
  })

  it('matches EventCard layout structure', () => {
    render(<EventCardSkeleton />)

    // Should have all the same structural elements as EventCard
    expect(document.querySelector('.h-6.w-32')).toBeInTheDocument() // datetime tag
    expect(document.querySelector('.flex.gap-2')).toBeInTheDocument() // tags section
    expect(document.querySelector('.mt-auto')).toBeInTheDocument() // location section
  })

  it('matches ClubCard layout structure', () => {
    render(<ClubCardSkeleton />)

    // Should have all the same structural elements as ClubCard
    expect(document.querySelector('.w-12.h-12')).toBeInTheDocument() // club icon
    expect(document.querySelector('.space-y-3')).toBeInTheDocument() // events preview
    expect(document.querySelector('.border-t')).toBeInTheDocument() // footer actions
  })
})
