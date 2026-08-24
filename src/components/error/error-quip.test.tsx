import { afterEach, describe, expect, it, vi } from 'vitest'
import { act } from '@testing-library/react'
import { render, screen } from '@/lib/test-utils'
import { ErrorQuip } from './error-quip'

const QUIPS = ['Première foulée.', 'Deuxième foulée.', 'Troisième foulée.']

afterEach(() => {
  vi.useRealTimers()
})

describe('ErrorQuip', () => {
  it('shows the first quip immediately', () => {
    render(<ErrorQuip quips={QUIPS} />)

    expect(screen.getByText('Première foulée.')).toBeInTheDocument()
  })

  it('rotates to the next quip and wraps around', () => {
    vi.useFakeTimers()
    render(<ErrorQuip quips={QUIPS} />)

    for (const expected of ['Deuxième foulée.', 'Troisième foulée.']) {
      act(() => {
        vi.advanceTimersByTime(4200)
        vi.advanceTimersByTime(300)
      })
      expect(screen.getByText(expected)).toBeInTheDocument()
    }

    act(() => {
      vi.advanceTimersByTime(4200)
      vi.advanceTimersByTime(300)
    })
    expect(screen.getByText('Première foulée.')).toBeInTheDocument()
  })

  it('does not start a timer for a single quip', () => {
    vi.useFakeTimers()
    render(<ErrorQuip quips={['Seule foulée.']} />)

    act(() => {
      vi.advanceTimersByTime(20000)
    })

    expect(screen.getByText('Seule foulée.')).toBeInTheDocument()
  })

  it('renders nothing when there are no quips', () => {
    const { container } = render(<ErrorQuip quips={[]} />)

    expect(container.querySelector('.qr-error-quip')).toBeNull()
  })
})
