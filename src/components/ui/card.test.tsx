import { describe, it, expect } from 'vitest'
import { render, screen } from '@/lib/test-utils'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { Card } from './card'

describe('Card Component', () => {
  describe('Basic Rendering', () => {
    it('renders children content correctly', () => {
      render(<Card>Test content</Card>)

      expect(screen.getByText('Test content')).toBeInTheDocument()
    })

    it('renders as section element by default', () => {
      render(<Card>Default content</Card>)

      const card = screen.getByText('Default content')
      expect(card.tagName).toBe('SECTION')
    })

    it('renders as different HTML elements when specified', () => {
      const { rerender } = render(<Card>Content</Card>)
      expect(screen.getByText('Content').tagName).toBe('SECTION')

      rerender(<Card as="article">Article content</Card>)
      expect(screen.getByText('Article content').tagName).toBe('ARTICLE')

      rerender(<Card as="div">Div content</Card>)
      expect(screen.getByText('Div content').tagName).toBe('DIV')
    })
  })

  describe('User Interactions', () => {
    it('handles click events correctly', async () => {
      const user = userEvent.setup()
      const handleClick = vi.fn()

      render(<Card onClick={handleClick}>Clickable card</Card>)

      await user.click(screen.getByText('Clickable card'))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('handles keyboard interactions when focusable', async () => {
      const user = userEvent.setup()
      const handleKeyDown = vi.fn()

      render(
        <Card onKeyDown={handleKeyDown} tabIndex={0}>
          Keyboard interactive card
        </Card>
      )

      const card = screen.getByText('Keyboard interactive card')
      card.focus()
      expect(card).toHaveFocus()

      await user.keyboard('{Enter}')
      expect(handleKeyDown).toHaveBeenCalledTimes(1)
    })

    it('handles mouse hover events', async () => {
      const user = userEvent.setup()
      const handleMouseEnter = vi.fn()
      const handleMouseLeave = vi.fn()

      render(
        <Card onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          Hover card
        </Card>
      )

      const card = screen.getByText('Hover card')

      await user.hover(card)
      expect(handleMouseEnter).toHaveBeenCalledTimes(1)

      await user.unhover(card)
      expect(handleMouseLeave).toHaveBeenCalledTimes(1)
    })
  })

  describe('Props and Attributes', () => {
    it('forwards HTML attributes correctly', () => {
      render(
        <Card
          id="card-id"
          role="region"
          aria-label="Test card"
          data-testid="test-card"
        >
          Attributed card
        </Card>
      )

      const card = screen.getByTestId('test-card')
      expect(card).toHaveAttribute('id', 'card-id')
      expect(card).toHaveAttribute('role', 'region')
      expect(card).toHaveAttribute('aria-label', 'Test card')
    })

    it('applies custom className', () => {
      render(<Card className="custom-class">Custom card</Card>)

      const card = screen.getByText('Custom card')
      expect(card).toHaveClass('custom-class')
    })

    it('applies custom styles through style prop', () => {
      render(<Card style={{ backgroundColor: 'red' }}>Styled card</Card>)

      const card = screen.getByText('Styled card')
      expect(card).toHaveStyle('background-color: rgb(255, 0, 0)')
    })
  })

  describe('Content Flexibility', () => {
    it('handles complex children elements', () => {
      render(
        <Card>
          <h2>Card Title</h2>
          <p>Card description with some text.</p>
          <span>Additional content</span>
        </Card>
      )

      expect(
        screen.getByRole('heading', { name: 'Card Title' })
      ).toBeInTheDocument()
      expect(
        screen.getByText('Card description with some text.')
      ).toBeInTheDocument()
      expect(screen.getByText('Additional content')).toBeInTheDocument()
    })

    it('handles empty content gracefully', () => {
      render(<Card data-testid="empty-card">{null}</Card>)

      const card = screen.getByTestId('empty-card')
      expect(card).toBeInTheDocument()
      expect(card).toHaveTextContent('')
    })

    it('handles text with special characters', () => {
      const specialText = 'Card with special chars: éàç • – "" …'
      render(<Card>{specialText}</Card>)

      expect(screen.getByText(specialText)).toBeInTheDocument()
    })

    it('handles very long content', () => {
      const longContent =
        'Very long content that should still work properly '.repeat(20)

      render(<Card>{longContent}</Card>)

      // Test with partial match since the full string is very long
      expect(
        screen.getByText(/Very long content.*work properly/)
      ).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('provides semantic structure by default', () => {
      render(<Card>Accessible card</Card>)

      const card = screen.getByText('Accessible card')
      expect(card.tagName).toBe('SECTION')
    })

    it('supports ARIA attributes', () => {
      render(
        <Card aria-label="Custom card" aria-describedby="description">
          ARIA card
        </Card>
      )

      const card = screen.getByLabelText('Custom card')
      expect(card).toBeInTheDocument()
      expect(card).toHaveAttribute('aria-describedby', 'description')
    })

    it('maintains keyboard accessibility when focusable', async () => {
      const user = userEvent.setup()

      render(<Card tabIndex={0}>Keyboard accessible card</Card>)

      const card = screen.getByText('Keyboard accessible card')

      await user.tab()
      expect(card).toHaveFocus()
    })

    it('supports semantic HTML variants', () => {
      render(<Card as="article">Article card</Card>)

      const card = screen.getByText('Article card')
      expect(card.tagName).toBe('ARTICLE')
    })
  })
})
