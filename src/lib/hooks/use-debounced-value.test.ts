import { renderHook } from '@testing-library/react'
import { vi } from 'vitest'
import { useDebouncedValue } from './use-debounced-value'
import { act } from 'react'

describe('useDebouncedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebouncedValue('test', 300))
    expect(result.current).toBe('test')
  })

  it('debounces value changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: 'initial' } }
    )

    rerender({ value: 'updated' })
    expect(result.current).toBe('initial')

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current).toBe('updated')
  })

  it('cancels previous timeout on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: 'first' } }
    )

    rerender({ value: 'second' })
    act(() => {
      vi.advanceTimersByTime(150)
    })

    rerender({ value: 'third' })
    act(() => {
      vi.advanceTimersByTime(150)
    })
    expect(result.current).toBe('first')

    act(() => {
      vi.advanceTimersByTime(150)
    })
    expect(result.current).toBe('third')
  })
})
