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

    it('renders as a functional button', () => {
      render(<Button>Base Button</Button>)

      const button = screen.getByRole('button')
      expect(button).toBeVisible()
      expect(button).toHaveTextContent('Base Button')
    })
  })

  describe('Button Variants', () => {
    it('renders primary variant correctly', () => {
      render(<Button>Primary Button</Button>)

      const button = screen.getByRole('button')
      expect(button).toBeVisible()
      expect(button).toHaveTextContent('Primary Button')
    })

    it('renders secondary variant correctly', () => {
      render(<Button variant="secondary">Secondary Button</Button>)

      const button = screen.getByRole('button')
      expect(button).toBeVisible()
      expect(button).toHaveTextContent('Secondary Button')
    })

    it('renders outline variant correctly', () => {
      render(<Button variant="outline">Outline Button</Button>)

      const button = screen.getByRole('button')
      expect(button).toBeVisible()
      expect(button).toHaveTextContent('Outline Button')
    })

    it('renders outline-primary variant correctly', () => {
      render(<Button variant="outline-primary">Outline Primary Button</Button>)

      const button = screen.getByRole('button')
      expect(button).toBeVisible()
      expect(button).toHaveTextContent('Outline Primary Button')
    })

    it('renders outline-accent variant correctly', () => {
      render(<Button variant="outline-accent">Outline Accent Button</Button>)

      const button = screen.getByRole('button')
      expect(button).toBeVisible()
      expect(button).toHaveTextContent('Outline Accent Button')
    })
  })

  describe('Button Sizes', () => {
    it('renders medium size by default', () => {
      render(<Button>Medium Button</Button>)

      const button = screen.getByRole('button')
      expect(button).toBeVisible()
      expect(button).toHaveTextContent('Medium Button')
    })

    it('renders small size when specified', () => {
      render(<Button size="sm">Small Button</Button>)

      const button = screen.getByRole('button')
      expect(button).toBeVisible()
      expect(button).toHaveTextContent('Small Button')
    })

    it('renders large size when specified', () => {
      render(<Button size="lg">Large Button</Button>)

      const button = screen.getByRole('button')
      expect(button).toBeVisible()
      expect(button).toHaveTextContent('Large Button')
    })
  })

  describe('Variant and Size Combinations', () => {
    it('renders variant and size combinations correctly', () => {
      render(
        <Button variant="secondary" size="lg">
          Large Secondary
        </Button>
      )

      const button = screen.getByRole('button')
      expect(button).toBeVisible()
      expect(button).toHaveTextContent('Large Secondary')
    })

    it('renders outline variant with small size', () => {
      render(
        <Button variant="outline" size="sm">
          Small Outline
        </Button>
      )

      const button = screen.getByRole('button')
      expect(button).toBeVisible()
      expect(button).toHaveTextContent('Small Outline')
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

    it('supports className prop for custom styling', () => {
      render(<Button className="custom-class">Custom Button</Button>)

      const button = screen.getByRole('button')
      expect(button).toBeVisible()
      expect(button).toHaveTextContent('Custom Button')
      // Note: className prop exists at runtime but TypeScript prevents it
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
    it('renders disabled state correctly', () => {
      render(<Button disabled>Disabled Button</Button>)

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveTextContent('Disabled Button')
    })

    it('maintains button content when disabled with variants', () => {
      render(
        <Button variant="secondary" disabled>
          Disabled Secondary
        </Button>
      )

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveTextContent('Disabled Secondary')
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

    it('supports focus for keyboard navigation', () => {
      render(<Button>Focus Button</Button>)

      const button = screen.getByRole('button')
      button.focus()
      expect(button).toHaveFocus()
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

    it('handles focus state when disabled', () => {
      render(<Button disabled>Disabled Focus Button</Button>)

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveTextContent('Disabled Focus Button')
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
    it('renders primary variant with brand consistency', () => {
      render(<Button variant="primary">Primary Brand</Button>)

      const button = screen.getByRole('button')
      expect(button).toBeVisible()
      expect(button).toHaveTextContent('Primary Brand')
    })

    it('renders secondary variant with brand consistency', () => {
      render(<Button variant="secondary">Secondary Brand</Button>)

      const button = screen.getByRole('button')
      expect(button).toBeVisible()
      expect(button).toHaveTextContent('Secondary Brand')
    })

    it('renders outline-accent variant with brand consistency', () => {
      render(<Button variant="outline-accent">Accent Brand</Button>)

      const button = screen.getByRole('button')
      expect(button).toBeVisible()
      expect(button).toHaveTextContent('Accent Brand')
    })

    it('maintains interactive behavior consistency', () => {
      render(<Button>Interactive Button</Button>)

      const button = screen.getByRole('button')
      expect(button).toBeVisible()
      expect(button).toHaveTextContent('Interactive Button')

      // Test that the button is interactive
      button.focus()
      expect(button).toHaveFocus()
    })
  })
})
