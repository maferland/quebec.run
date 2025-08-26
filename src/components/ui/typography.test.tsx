import { describe, it, expect } from 'vitest'
import { render, screen } from '@/lib/test-utils'
import { Typography, Heading, Text, Caption, Overline } from './typography'

describe('Typography Component', () => {
  it('renders children correctly', () => {
    render(<Typography>Test content</Typography>)
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('applies default props correctly', () => {
    const { container } = render(<Typography>Default typography</Typography>)
    const element = container.firstChild as HTMLElement

    // Should render as p element (body variant default)
    expect(element.tagName).toBe('P')
    // Should have body variant styles
    expect(element).toHaveClass('text-base', 'leading-relaxed', 'font-body')
    // Should have default alignment and color
    expect(element).toHaveClass('text-left', 'text-inherit')
    // Should have normal weight (body default)
    expect(element).toHaveClass('font-normal')
  })

  describe('Variants', () => {
    it('renders heading variants with correct elements and styles', () => {
      const { container: h1Container } = render(
        <Typography variant="heading1">H1 Text</Typography>
      )
      const { container: h2Container } = render(
        <Typography variant="heading2">H2 Text</Typography>
      )
      const { container: h6Container } = render(
        <Typography variant="heading6">H6 Text</Typography>
      )

      const h1 = h1Container.firstChild as HTMLElement
      const h2 = h2Container.firstChild as HTMLElement
      const h6 = h6Container.firstChild as HTMLElement

      expect(h1.tagName).toBe('H1')
      expect(h2.tagName).toBe('H2')
      expect(h6.tagName).toBe('H6')

      expect(h1).toHaveClass(
        'text-4xl',
        'md:text-5xl',
        'font-heading',
        'font-bold'
      )
      expect(h2).toHaveClass(
        'text-3xl',
        'md:text-4xl',
        'font-heading',
        'font-bold'
      )
      expect(h6).toHaveClass(
        'text-base',
        'md:text-lg',
        'font-heading',
        'font-bold'
      )
    })

    it('renders body variants with correct styles', () => {
      const { container: bodyContainer } = render(
        <Typography variant="body">Body text</Typography>
      )
      const { container: bodyLargeContainer } = render(
        <Typography variant="bodyLarge">Large body text</Typography>
      )
      const { container: bodySmallContainer } = render(
        <Typography variant="bodySmall">Small body text</Typography>
      )

      const body = bodyContainer.firstChild as HTMLElement
      const bodyLarge = bodyLargeContainer.firstChild as HTMLElement
      const bodySmall = bodySmallContainer.firstChild as HTMLElement

      // All should be p elements
      expect(body.tagName).toBe('P')
      expect(bodyLarge.tagName).toBe('P')
      expect(bodySmall.tagName).toBe('P')

      // Check size classes
      expect(body).toHaveClass('text-base', 'font-body', 'font-normal')
      expect(bodyLarge).toHaveClass('text-lg', 'font-body', 'font-normal')
      expect(bodySmall).toHaveClass('text-sm', 'font-body', 'font-normal')
    })

    it('renders caption and overline variants correctly', () => {
      const { container: captionContainer } = render(
        <Typography variant="caption">Caption text</Typography>
      )
      const { container: overlineContainer } = render(
        <Typography variant="overline">Overline text</Typography>
      )

      const caption = captionContainer.firstChild as HTMLElement
      const overline = overlineContainer.firstChild as HTMLElement

      // Both should be span elements
      expect(caption.tagName).toBe('SPAN')
      expect(overline.tagName).toBe('SPAN')

      expect(caption).toHaveClass('text-xs', 'font-body', 'font-normal')
      expect(overline).toHaveClass(
        'text-xs',
        'uppercase',
        'tracking-wider',
        'font-body',
        'font-normal'
      )
    })
  })

  describe('Colors', () => {
    it('applies color variants correctly', () => {
      const { container: primaryContainer } = render(
        <Typography color="primary">Primary text</Typography>
      )
      const { container: secondaryContainer } = render(
        <Typography color="secondary">Secondary text</Typography>
      )
      const { container: mutedContainer } = render(
        <Typography color="muted">Muted text</Typography>
      )

      expect(primaryContainer.firstChild).toHaveClass('text-primary')
      expect(secondaryContainer.firstChild).toHaveClass('text-secondary')
      expect(mutedContainer.firstChild).toHaveClass('text-accent/70')
    })
  })

  describe('Weights', () => {
    it('applies weight variants correctly', () => {
      const { container: lightContainer } = render(
        <Typography weight="light">Light text</Typography>
      )
      const { container: boldContainer } = render(
        <Typography weight="bold">Bold text</Typography>
      )

      expect(lightContainer.firstChild).toHaveClass('font-light')
      expect(boldContainer.firstChild).toHaveClass('font-bold')
    })

    it('uses default weights for heading vs body variants', () => {
      const { container: headingContainer } = render(
        <Typography variant="heading2">
          Heading without explicit weight
        </Typography>
      )
      const { container: bodyContainer } = render(
        <Typography variant="body">Body without explicit weight</Typography>
      )

      expect(headingContainer.firstChild).toHaveClass('font-bold') // headings default to bold
      expect(bodyContainer.firstChild).toHaveClass('font-normal') // body defaults to normal
    })

    it('overrides default weights when explicit weight is provided', () => {
      const { container } = render(
        <Typography variant="heading2" weight="light">
          Light heading
        </Typography>
      )

      expect(container.firstChild).toHaveClass('font-light')
      expect(container.firstChild).not.toHaveClass('font-bold')
    })
  })

  describe('Alignment', () => {
    it('applies alignment variants correctly', () => {
      const { container: centerContainer } = render(
        <Typography align="center">Centered text</Typography>
      )
      const { container: rightContainer } = render(
        <Typography align="right">Right aligned text</Typography>
      )

      expect(centerContainer.firstChild).toHaveClass('text-center')
      expect(rightContainer.firstChild).toHaveClass('text-right')
    })
  })

  describe('Custom element override', () => {
    it('renders as custom element when as prop is provided', () => {
      const { container: divContainer } = render(
        <Typography variant="heading1" as="div">
          Heading as div
        </Typography>
      )
      const { container: spanContainer } = render(
        <Typography variant="body" as="span">
          Body as span
        </Typography>
      )

      expect(divContainer.firstChild?.tagName).toBe('DIV')
      expect(spanContainer.firstChild?.tagName).toBe('SPAN')

      // Should still have the variant styles
      expect(divContainer.firstChild).toHaveClass(
        'text-4xl',
        'md:text-5xl',
        'font-heading'
      )
      expect(spanContainer.firstChild).toHaveClass('text-base', 'font-body')
    })
  })

  describe('Custom className', () => {
    it('merges custom className with variant classes', () => {
      const { container } = render(
        <Typography className="custom-class" variant="heading1">
          Custom styled heading
        </Typography>
      )

      const element = container.firstChild as HTMLElement
      expect(element).toHaveClass('custom-class')
      expect(element).toHaveClass('text-4xl', 'font-heading') // variant classes should still be present
    })
  })

  describe('HTML attributes', () => {
    it('passes through HTML attributes correctly', () => {
      const { container } = render(
        <Typography id="test-id" data-testid="typography" role="banner">
          Text with attributes
        </Typography>
      )

      const element = container.firstChild as HTMLElement
      expect(element).toHaveAttribute('id', 'test-id')
      expect(element).toHaveAttribute('data-testid', 'typography')
      expect(element).toHaveAttribute('role', 'banner')
    })
  })
})

describe('Convenience Components', () => {
  describe('Heading', () => {
    it('renders different heading levels correctly', () => {
      const { container: h1Container } = render(<Heading level={1}>H1</Heading>)
      const { container: h3Container } = render(<Heading level={3}>H3</Heading>)
      const { container: h6Container } = render(<Heading level={6}>H6</Heading>)

      expect(h1Container.firstChild?.tagName).toBe('H1')
      expect(h3Container.firstChild?.tagName).toBe('H3')
      expect(h6Container.firstChild?.tagName).toBe('H6')

      expect(h1Container.firstChild).toHaveClass('text-4xl', 'md:text-5xl')
      expect(h3Container.firstChild).toHaveClass('text-2xl', 'md:text-3xl')
      expect(h6Container.firstChild).toHaveClass('text-base', 'md:text-lg')
    })

    it('defaults to level 1 when no level provided', () => {
      const { container } = render(<Heading>Default heading</Heading>)
      expect(container.firstChild?.tagName).toBe('H1')
      expect(container.firstChild).toHaveClass('text-4xl', 'md:text-5xl')
    })

    it('passes through other Typography props', () => {
      const { container } = render(
        <Heading level={2} color="secondary" weight="light">
          Styled heading
        </Heading>
      )

      expect(container.firstChild).toHaveClass('text-secondary', 'font-light')
    })
  })

  describe('Text', () => {
    it('renders as body variant by default', () => {
      const { container } = render(<Text>Body text</Text>)

      expect(container.firstChild?.tagName).toBe('P')
      expect(container.firstChild).toHaveClass('text-base', 'font-body')
    })

    it('passes through Typography props', () => {
      const { container } = render(
        <Text color="primary" weight="semibold" align="center">
          Styled text
        </Text>
      )

      expect(container.firstChild).toHaveClass(
        'text-primary',
        'font-semibold',
        'text-center'
      )
    })
  })

  describe('Caption', () => {
    it('renders as caption variant', () => {
      const { container } = render(<Caption>Caption text</Caption>)

      expect(container.firstChild?.tagName).toBe('SPAN')
      expect(container.firstChild).toHaveClass('text-xs', 'font-body')
    })
  })

  describe('Overline', () => {
    it('renders as overline variant with uppercase styling', () => {
      const { container } = render(<Overline>Overline text</Overline>)

      expect(container.firstChild?.tagName).toBe('SPAN')
      expect(container.firstChild).toHaveClass(
        'text-xs',
        'uppercase',
        'tracking-wider'
      )
    })
  })
})

describe('Real-world usage patterns', () => {
  it('renders event card typography correctly', () => {
    render(
      <div>
        <Heading level={3} color="primary">
          6AM Club Limoilou
        </Heading>
        <Caption color="muted">6AM Club • Wed, Sep 4 • 06:00</Caption>
        <Text color="accent">Course matinale dans le quartier Limoilou</Text>
      </div>
    )

    expect(screen.getByText('6AM Club Limoilou')).toHaveClass(
      'text-2xl',
      'font-heading',
      'text-primary'
    )
    expect(screen.getByText('6AM Club • Wed, Sep 4 • 06:00')).toHaveClass(
      'text-xs',
      'text-accent/70'
    )
    expect(
      screen.getByText('Course matinale dans le quartier Limoilou')
    ).toHaveClass('text-base', 'font-body', 'text-accent')
  })

  it('renders responsive heading correctly', () => {
    const { container } = render(
      <Heading level={1} color="primary">
        Discover Running in Quebec City
      </Heading>
    )

    const heading = container.firstChild as HTMLElement
    expect(heading).toHaveClass('text-4xl', 'md:text-5xl', 'leading-tight')
  })
})
