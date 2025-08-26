import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ContentGrid } from './content-grid'

describe('ContentGrid Component', () => {
  it('renders all children correctly', () => {
    render(
      <ContentGrid>
        <div>Card 1</div>
        <div>Card 2</div>
        <div>Card 3</div>
        <div>Card 4</div>
        <div>Card 5</div>
        <div>Card 6</div>
      </ContentGrid>
    )

    expect(screen.getByText('Card 1')).toBeInTheDocument()
    expect(screen.getByText('Card 2')).toBeInTheDocument()
    expect(screen.getByText('Card 3')).toBeInTheDocument()
    expect(screen.getByText('Card 4')).toBeInTheDocument()
    expect(screen.getByText('Card 5')).toBeInTheDocument()
    expect(screen.getByText('Card 6')).toBeInTheDocument()
  })

  it('preserves child component functionality', () => {
    const handleClick1 = vi.fn()
    const handleClick2 = vi.fn()

    render(
      <ContentGrid>
        <button onClick={handleClick1}>Button 1</button>
        <button onClick={handleClick2}>Button 2</button>
      </ContentGrid>
    )

    const button1 = screen.getByRole('button', { name: 'Button 1' })
    const button2 = screen.getByRole('button', { name: 'Button 2' })

    button1.click()
    button2.click()

    expect(handleClick1).toHaveBeenCalledOnce()
    expect(handleClick2).toHaveBeenCalledOnce()
  })

  it('renders complex child components', () => {
    render(
      <ContentGrid>
        <article>
          <h2>Article Title</h2>
          <p>Article content</p>
        </article>
        <div>
          <span>Nested content</span>
          <strong>Important text</strong>
        </div>
      </ContentGrid>
    )

    expect(screen.getByRole('article')).toBeInTheDocument()
    expect(screen.getByText('Article Title')).toBeInTheDocument()
    expect(screen.getByText('Article content')).toBeInTheDocument()
    expect(screen.getByText('Nested content')).toBeInTheDocument()
    expect(screen.getByText('Important text')).toBeInTheDocument()
  })

  it('handles empty children gracefully', () => {
    const { container } = render(
      <ContentGrid>
        {null}
        {false}
        {undefined}
      </ContentGrid>
    )

    expect(container.firstChild).toBeInTheDocument()
    expect(container.firstChild?.textContent).toBe('')
  })

  it('renders with different configurations', () => {
    const { rerender } = render(
      <ContentGrid columns="2">
        <div>Item A</div>
        <div>Item B</div>
      </ContentGrid>
    )

    expect(screen.getByText('Item A')).toBeInTheDocument()
    expect(screen.getByText('Item B')).toBeInTheDocument()

    rerender(
      <ContentGrid columns="4" gap="lg">
        <div>Item C</div>
        <div>Item D</div>
      </ContentGrid>
    )

    expect(screen.getByText('Item C')).toBeInTheDocument()
    expect(screen.getByText('Item D')).toBeInTheDocument()
  })

  it('accepts custom className without breaking functionality', () => {
    render(
      <ContentGrid className="custom-grid">
        <div>Custom content</div>
      </ContentGrid>
    )

    expect(screen.getByText('Custom content')).toBeInTheDocument()
  })
})
