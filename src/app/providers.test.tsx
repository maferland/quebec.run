import { render } from '@testing-library/react'
import { Providers } from './providers'

describe('Providers', () => {
  it('renders children', () => {
    const { getByText } = render(
      <Providers>
        <div>Test Content</div>
      </Providers>
    )

    expect(getByText('Test Content')).toBeInTheDocument()
  })
})
