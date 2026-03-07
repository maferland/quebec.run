import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OccurrencePreview } from './occurrence-preview'

describe('OccurrencePreview', () => {
  it('renders next occurrences', () => {
    const pattern = 'FREQ=WEEKLY;BYDAY=TU;BYHOUR=18;BYMINUTE=0'

    render(<OccurrencePreview pattern={pattern} count={5} />)

    expect(screen.getByText(/next occurrences/i)).toBeInTheDocument()
  })

  it('shows message when pattern is invalid', () => {
    const pattern = 'INVALID_PATTERN'

    render(<OccurrencePreview pattern={pattern} count={5} />)

    expect(screen.getByText(/invalid/i)).toBeInTheDocument()
  })

  it('displays correct number of occurrences', () => {
    const pattern = 'FREQ=DAILY;BYHOUR=10;BYMINUTE=0'

    render(<OccurrencePreview pattern={pattern} count={3} />)

    const listItems = screen.getAllByRole('listitem')
    expect(listItems).toHaveLength(3)
  })

  it('respects count parameter', () => {
    const pattern = 'FREQ=DAILY;BYHOUR=10;BYMINUTE=0'

    const { rerender } = render(
      <OccurrencePreview pattern={pattern} count={5} />
    )
    expect(screen.getAllByRole('listitem')).toHaveLength(5)

    rerender(<OccurrencePreview pattern={pattern} count={2} />)
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })
})
