import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@/lib/test-utils'
import { vi } from 'vitest'
import { Button } from './button'

describe('Button Component', () => {
  describe('Basic Rendering', () => {
    it('renders children correctly', () => {
      render(<Button>Click me</Button>)

      expect(
        screen.getByRole('button', { name: 'Click me' })
      ).toBeInTheDocument()
    })

    it('renders as button element with correct type', () => {
      render(<Button>Test Button</Button>)

      const button = screen.getByRole('button')
      expect(button.tagName).toBe('BUTTON')
      // Button element has implicit type="button" when no type is specified
      expect(button).not.toHaveAttribute('type')
    })

    it('applies base styles correctly', () => {
      render(<Button>Base Button</Button>)

      const button = screen.getByRole('button')
      expect(button).toHaveClass(
        'inline-flex',
        'items-center',
        'justify-center',
        'rounded-md',
        'font-medium',
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-offset-2',
        'disabled:opacity-50',
        'cursor-pointer',
        'disabled:cursor-not-allowed',
        'shadow-sm',
        'hover:shadow-md',
        'hover:scale-105',
        'transition-all',
        'duration-200'
      )
    })
  })

  describe('Variant Styling', () => {
    it('applies primary variant by default', () => {
      render(<Button>Primary Button</Button>)

      const button = screen.getByRole('button')
      expect(button).toHaveClass(
        'bg-primary',
        'text-text-inverse',
        'hover:bg-primary/90',
        'focus:ring-focus',
        'border',
        'border-primary'
      )
    })

    it('applies secondary variant when specified', () => {
      render(<Button variant="secondary">Secondary Button</Button>)

      const button = screen.getByRole('button')
      expect(button).toHaveClass(
        'bg-secondary',
        'text-text-inverse',
        'hover:bg-secondary/90',
        'focus:ring-focus',
        'border',
        'border-secondary'
      )
    })

    it('applies outline variant when specified', () => {
      render(<Button variant="outline">Outline Button</Button>)

      const button = screen.getByRole('button')
      expect(button).toHaveClass(
        'border',
        'border-border',
        'bg-surface',
        'text-text-primary',
        'hover:bg-hover',
        'hover:border-border-secondary',
        'focus:ring-focus'
      )
    })

    it('applies outline-primary variant when specified', () => {
      render(<Button variant="outline-primary">Outline Primary Button</Button>)

      const button = screen.getByRole('button')
      expect(button).toHaveClass(
        'border',
        'border-primary',
        'bg-surface',
        'text-primary',
        'hover:bg-primary/5',
        'hover:border-primary/80',
        'focus:ring-focus'
      )
    })

    it('applies outline-accent variant when specified', () => {
      render(<Button variant="outline-accent">Outline Accent Button</Button>)

      const button = screen.getByRole('button')
      expect(button).toHaveClass(
        'border',
        'border-accent',
        'bg-surface',
        'text-accent',
        'hover:bg-accent/5',
        'hover:border-accent/80',
        'focus:ring-focus'
      )
    })
  })

  describe('Size Styling', () => {
    it('applies medium size by default', () => {
      render(<Button>Medium Button</Button>)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('px-4', 'py-2', 'text-sm')
    })

    it('applies small size when specified', () => {
      render(<Button size="sm">Small Button</Button>)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('px-3', 'py-1.5', 'text-sm')
    })

    it('applies large size when specified', () => {
      render(<Button size="lg">Large Button</Button>)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('px-6', 'py-3', 'text-base')
    })
  })

  describe('Variant and Size Combinations', () => {
    it('applies both variant and size classes correctly', () => {
      render(
        <Button variant="secondary" size="lg">
          Large Secondary
        </Button>
      )

      const button = screen.getByRole('button')
      expect(button).toHaveClass(
        'bg-secondary',
        'text-text-inverse',
        'px-6',
        'py-3',
        'text-base'
      )
    })

    it('applies outline variant with small size', () => {
      render(
        <Button variant="outline" size="sm">
          Small Outline
        </Button>
      )

      const button = screen.getByRole('button')
      expect(button).toHaveClass(
        'border-border',
        'bg-surface',
        'px-3',
        'py-1.5',
        'text-sm'
      )
    })
  })

  describe('Props and Attributes', () => {
    it('forwards all button props correctly', () => {
      render(
        <Button
          disabled
          type="submit"
          id="test-button"
          data-testid="button-test"
          aria-label="Test button"
        >
          Disabled Button
        </Button>
      )

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveAttribute('type', 'submit')
      expect(button).toHaveAttribute('id', 'test-button')
      expect(button).toHaveAttribute('data-testid', 'button-test')
      expect(button).toHaveAttribute('aria-label', 'Test button')
    })

    it('prevents className prop via TypeScript', () => {
      // @ts-expect-error - className should not be allowed on Button
      render(<Button className="custom-class">Custom Button</Button>)

      const button = screen.getByRole('button')
      // Should still have default styles
      expect(button).toHaveClass(
        'inline-flex',
        'items-center',
        'justify-center'
      )
      expect(button).toHaveClass('bg-primary', 'px-4', 'py-2')
      // Should NOT have custom class since it's blocked
      expect(button).not.toHaveClass('custom-class')
    })

    it('applies custom styles through style prop', () => {
      render(<Button style={{ backgroundColor: 'red' }}>Styled Button</Button>)

      const button = screen.getByRole('button')
      expect(button).toHaveStyle('background-color: rgb(255, 0, 0)')
    })
  })

  describe('Event Handling', () => {
    it('calls onClick handler when clicked', () => {
      const handleClick = vi.fn()
      render(<Button onClick={handleClick}>Clickable Button</Button>)

      const button = screen.getByRole('button')
      fireEvent.click(button)

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('does not call onClick when disabled', () => {
      const handleClick = vi.fn()
      render(
        <Button onClick={handleClick} disabled>
          Disabled Button
        </Button>
      )

      const button = screen.getByRole('button')
      fireEvent.click(button)

      expect(handleClick).not.toHaveBeenCalled()
    })

    it('calls event handlers for other events', () => {
      const handleMouseEnter = vi.fn()
      const handleMouseLeave = vi.fn()
      const handleFocus = vi.fn()
      const handleBlur = vi.fn()

      render(
        <Button
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onFocus={handleFocus}
          onBlur={handleBlur}
        >
          Event Button
        </Button>
      )

      const button = screen.getByRole('button')

      fireEvent.mouseEnter(button)
      expect(handleMouseEnter).toHaveBeenCalledTimes(1)

      fireEvent.mouseLeave(button)
      expect(handleMouseLeave).toHaveBeenCalledTimes(1)

      fireEvent.focus(button)
      expect(handleFocus).toHaveBeenCalledTimes(1)

      fireEvent.blur(button)
      expect(handleBlur).toHaveBeenCalledTimes(1)
    })
  })

  describe('Disabled State', () => {
    it('applies disabled styling when disabled', () => {
      render(<Button disabled>Disabled Button</Button>)

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveClass(
        'disabled:opacity-50',
        'disabled:cursor-not-allowed'
      )
    })

    it('maintains variant styling when disabled', () => {
      render(
        <Button variant="secondary" disabled>
          Disabled Secondary
        </Button>
      )

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveClass('bg-secondary', 'text-text-inverse')
      expect(button).toHaveClass('disabled:opacity-50')
    })

    it('prevents interaction when disabled', () => {
      const handleClick = vi.fn()
      render(
        <Button onClick={handleClick} disabled>
          Disabled Button
        </Button>
      )

      const button = screen.getByRole('button')
      fireEvent.click(button)
      fireEvent.keyDown(button, { key: 'Enter' })
      fireEvent.keyDown(button, { key: ' ' })

      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('provides proper button semantics', () => {
      render(<Button>Accessible Button</Button>)

      const button = screen.getByRole('button')
      expect(button).toBeVisible()
      expect(button).toHaveProperty('tagName', 'BUTTON')
    })

    it('supports keyboard navigation', () => {
      render(<Button>Keyboard Button</Button>)

      const button = screen.getByRole('button')
      expect(button).not.toHaveAttribute('tabindex', '-1')

      button.focus()
      expect(button).toHaveFocus()
    })

    it('applies focus ring styles for keyboard navigation', () => {
      render(<Button>Focus Button</Button>)

      const button = screen.getByRole('button')
      expect(button).toHaveClass(
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-offset-2'
      )
    })

    it('supports aria attributes', () => {
      render(
        <Button
          aria-label="Custom label"
          aria-describedby="description"
          aria-pressed={true}
        >
          ARIA Button
        </Button>
      )

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Custom label')
      expect(button).toHaveAttribute('aria-describedby', 'description')
      expect(button).toHaveAttribute('aria-pressed', 'true')
    })

    it('maintains focus visibility when disabled', () => {
      render(<Button disabled>Disabled Focus Button</Button>)

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveClass('focus:outline-none', 'focus:ring-2')
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('handles empty children gracefully', () => {
      render(<Button></Button>)

      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(button).toHaveTextContent('')
    })

    it('handles complex children elements', () => {
      render(
        <Button>
          <span>Icon</span>
          <span>Text</span>
        </Button>
      )

      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(button).toHaveTextContent('IconText')
    })

    it('handles very long text content', () => {
      const longText =
        'This is a very long button text that should still render properly without breaking the layout or causing any issues with the button component styling and functionality'

      render(<Button>{longText}</Button>)

      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(button).toHaveTextContent(longText)
    })

    it('handles special characters in content', () => {
      render(<Button>Français • Español • 中文</Button>)

      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(button).toHaveTextContent('Français • Español • 中文')
    })
  })

  describe('Form Integration', () => {
    it('submits form when type is submit', () => {
      const handleSubmit = vi.fn((e) => e.preventDefault())

      render(
        <form onSubmit={handleSubmit}>
          <Button type="submit">Submit Button</Button>
        </form>
      )

      const button = screen.getByRole('button')
      fireEvent.click(button)

      expect(handleSubmit).toHaveBeenCalledTimes(1)
    })

    it('does not submit form when disabled', () => {
      const handleSubmit = vi.fn()

      render(
        <form onSubmit={handleSubmit}>
          <Button type="submit" disabled>
            Disabled Submit
          </Button>
        </form>
      )

      const button = screen.getByRole('button')
      fireEvent.click(button)

      expect(handleSubmit).not.toHaveBeenCalled()
    })

    it('has reset type when specified', () => {
      render(<Button type="reset">Reset Button</Button>)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('type', 'reset')

      // Note: Form reset behavior is browser-specific and hard to test in jsdom
      // This test just verifies the type attribute is correctly applied
    })
  })

  describe('Quebec.run Brand Integration', () => {
    it('uses Quebec.run primary color in primary variant', () => {
      render(<Button variant="primary">Primary Brand</Button>)

      const button = screen.getByRole('button')
      expect(button).toHaveClass(
        'bg-primary',
        'border-primary',
        'focus:ring-focus'
      )
    })

    it('uses Quebec.run secondary color in secondary variant', () => {
      render(<Button variant="secondary">Secondary Brand</Button>)

      const button = screen.getByRole('button')
      expect(button).toHaveClass(
        'bg-secondary',
        'border-secondary',
        'focus:ring-focus'
      )
    })

    it('uses Quebec.run accent color in outline-accent variant', () => {
      render(<Button variant="outline-accent">Accent Brand</Button>)

      const button = screen.getByRole('button')
      expect(button).toHaveClass(
        'border-accent',
        'text-accent',
        'hover:bg-accent/5',
        'hover:border-accent/80',
        'focus:ring-focus'
      )
    })

    it('applies consistent Quebec.run interaction effects', () => {
      render(<Button>Interactive Button</Button>)

      const button = screen.getByRole('button')
      expect(button).toHaveClass(
        'hover:shadow-md',
        'hover:scale-105',
        'transition-all',
        'duration-200'
      )
    })
  })
})
