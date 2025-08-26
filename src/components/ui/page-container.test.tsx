import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PageContainer } from './page-container'

describe('PageContainer Component', () => {
  it('renders children correctly', () => {
    render(
      <PageContainer>
        <h1>Page Title</h1>
        <p>Page content goes here</p>
      </PageContainer>
    )

    expect(screen.getByText('Page Title')).toBeInTheDocument()
    expect(screen.getByText('Page content goes here')).toBeInTheDocument()
  })

  it('renders multiple child elements', () => {
    render(
      <PageContainer>
        <header>Header content</header>
        <main>Main content</main>
        <footer>Footer content</footer>
      </PageContainer>
    )

    expect(screen.getByText('Header content')).toBeInTheDocument()
    expect(screen.getByText('Main content')).toBeInTheDocument()
    expect(screen.getByText('Footer content')).toBeInTheDocument()
  })

  it('handles empty children', () => {
    const { container } = render(<PageContainer>{null}</PageContainer>)

    expect(container.firstChild).toBeInTheDocument()
    expect(container.firstChild?.textContent).toBe('')
  })

  it('preserves child component functionality', () => {
    const handleClick = vi.fn()

    render(
      <PageContainer>
        <button onClick={handleClick}>Click me</button>
      </PageContainer>
    )

    const button = screen.getByRole('button', { name: 'Click me' })
    button.click()

    expect(handleClick).toHaveBeenCalledOnce()
  })
})
