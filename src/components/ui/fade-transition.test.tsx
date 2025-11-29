import { render } from '@testing-library/react'
import { FadeTransition } from './fade-transition'

describe('FadeTransition', () => {
  it('renders children', () => {
    const { getByText } = render(
      <FadeTransition show={true}>
        <div>Content</div>
      </FadeTransition>
    )
    expect(getByText('Content')).toBeInTheDocument()
  })

  it('applies full opacity when show=true', () => {
    const { container } = render(
      <FadeTransition show={true}>
        <div>Content</div>
      </FadeTransition>
    )
    expect(container.firstChild).toHaveClass('opacity-100')
  })

  it('applies reduced opacity when show=false', () => {
    const { container } = render(
      <FadeTransition show={false}>
        <div>Content</div>
      </FadeTransition>
    )
    expect(container.firstChild).toHaveClass('opacity-40')
  })

  it('applies transition classes', () => {
    const { container } = render(
      <FadeTransition show={true}>
        <div>Content</div>
      </FadeTransition>
    )
    expect(container.firstChild).toHaveClass(
      'transition-opacity',
      'duration-300'
    )
  })
})
