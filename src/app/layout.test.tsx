import { render } from '@testing-library/react'
import RootLayout from './layout'

describe('RootLayout', () => {
  it('renders children', () => {
    const { getByText } = render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    )

    expect(getByText('Test Content')).toBeInTheDocument()
  })
})
