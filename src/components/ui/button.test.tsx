import { render, screen } from '@/lib/test-utils'
import { Button } from './button'

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('applies primary variant by default', () => {
    render(<Button>Primary Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-blue-600', 'text-white')
  })

  it('applies secondary variant when specified', () => {
    render(<Button variant="secondary">Secondary Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-gray-600', 'text-white')
  })

  it('applies outline variant when specified', () => {
    render(<Button variant="outline">Outline Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('border', 'border-gray-300', 'bg-white')
  })

  it('applies medium size by default', () => {
    render(<Button>Medium Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('px-4', 'py-2')
  })

  it('applies small size when specified', () => {
    render(<Button size="sm">Small Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('px-3', 'py-1.5')
  })

  it('applies large size when specified', () => {
    render(<Button size="lg">Large Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('px-6', 'py-3')
  })

  it('forwards props to button element', () => {
    render(<Button disabled>Disabled Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('merges custom className with default styles', () => {
    render(<Button className="custom-class">Custom Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class', 'bg-blue-600')
  })

  it('calls onClick handler when clicked', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Clickable Button</Button>)

    const button = screen.getByRole('button')
    button.click()

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
    button.click()

    expect(handleClick).not.toHaveBeenCalled()
  })
})
