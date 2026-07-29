import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ExploreProviders, SiteProviders } from './providers'

describe.each([
  { name: 'SiteProviders', Wrapper: SiteProviders },
  { name: 'ExploreProviders', Wrapper: ExploreProviders },
])('$name', ({ Wrapper }) => {
  it('renders children', () => {
    render(
      <Wrapper>
        <div>Test Content</div>
      </Wrapper>
    )

    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })
})
