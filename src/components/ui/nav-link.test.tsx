import { render, screen } from '@testing-library/react'
import { NavLink } from './nav-link'
import { Users } from 'lucide-react'

describe('NavLink', () => {
  it('renders with children', () => {
    render(
      <NavLink href="/clubs">
        <Users size={18} />
        <span>Clubs</span>
      </NavLink>
    )

    expect(screen.getByRole('link', { name: /clubs/i })).toBeInTheDocument()
  })

  it('has correct href', () => {
    render(
      <NavLink href="/clubs">
        <span>Clubs</span>
      </NavLink>
    )

    expect(screen.getByRole('link')).toHaveAttribute('href', '/clubs')
  })

  it('applies active styles when isActive is true', () => {
    render(
      <NavLink href="/clubs" isActive>
        <span>Clubs</span>
      </NavLink>
    )

    const link = screen.getByRole('link')
    expect(link).toHaveClass('text-primary', 'bg-primary/10')
  })

  it('applies default styles when isActive is false', () => {
    render(
      <NavLink href="/clubs">
        <span>Clubs</span>
      </NavLink>
    )

    const link = screen.getByRole('link')
    expect(link).toHaveClass('text-accent')
    expect(link).not.toHaveClass('bg-primary/10')
  })

  it('has hover states in className', () => {
    render(
      <NavLink href="/clubs">
        <span>Clubs</span>
      </NavLink>
    )

    const link = screen.getByRole('link')
    expect(link).toHaveClass('hover:bg-primary/5', 'hover:text-primary')
  })
})
