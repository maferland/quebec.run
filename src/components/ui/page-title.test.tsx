import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PageTitle } from './page-title'

describe('PageTitle Component', () => {
  it('renders children correctly', () => {
    render(<PageTitle>Running Events</PageTitle>)

    expect(screen.getByText('Running Events')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Running Events'
    )
  })

  it('accepts custom className', () => {
    render(<PageTitle className="text-center">Centered Title</PageTitle>)

    expect(screen.getByText('Centered Title')).toBeInTheDocument()
  })

  it('renders complex children', () => {
    render(
      <PageTitle>
        <span>Running</span> Events
      </PageTitle>
    )

    expect(screen.getByText('Running')).toBeInTheDocument()
    expect(screen.getByText('Events')).toBeInTheDocument()
  })
})
