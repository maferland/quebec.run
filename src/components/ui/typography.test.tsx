import { render, screen } from '@/lib/test-utils'
import { describe, expect, it } from 'vitest'
import { Caption, Heading, Overline, Text, Typography } from './typography'

describe('Typography Component', () => {
  it('renders children correctly', () => {
    render(<Typography>Test content</Typography>)
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it.each([
    [1, 'heading1', 'H1 Text'],
    [2, 'heading2', 'H2 Text'],
    [3, 'heading3', 'H3 Text'],
    [4, 'heading4', 'H4 Text'],
    [5, 'heading5', 'H5 Text'],
    [6, 'heading6', 'H6 Text'],
  ] as const)(
    'renders heading%i variant with correct semantic element',
    (level, variant, text) => {
      render(<Typography variant={variant}>{text}</Typography>)

      const heading = screen.getByRole('heading', { level })
      expect(heading).toBeInTheDocument()
      expect(heading).toHaveTextContent(text)
    }
  )

  it('passes through HTML attributes correctly', () => {
    render(
      <Typography id="test-id" data-testid="typography" role="banner">
        Text with attributes
      </Typography>
    )

    const element = screen.getByTestId('typography')
    expect(element).toHaveAttribute('id', 'test-id')
    expect(element).toHaveAttribute('role', 'banner')
  })
})

describe('Convenience Components', () => {
  it('Heading defaults to level 1 when no level provided', () => {
    render(<Heading>Default heading</Heading>)

    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('Default heading')
  })

  it('Text component renders text content', () => {
    render(<Text>Body text</Text>)
    expect(screen.getByText('Body text')).toBeInTheDocument()
  })

  it('Caption component renders text content', () => {
    render(<Caption>Caption text</Caption>)
    expect(screen.getByText('Caption text')).toBeInTheDocument()
  })

  it('Overline component renders text content', () => {
    render(<Overline>Overline text</Overline>)
    expect(screen.getByText('Overline text')).toBeInTheDocument()
  })
})
