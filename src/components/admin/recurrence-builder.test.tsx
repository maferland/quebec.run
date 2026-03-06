import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/lib/test-utils'
import userEvent from '@testing-library/user-event'
import { RecurrenceBuilder } from './recurrence-builder'

describe('RecurrenceBuilder', () => {
  it('renders frequency selector', () => {
    const onChange = vi.fn()
    render(
      <RecurrenceBuilder
        value={{
          frequency: 'weekly',
          interval: 1,
          byweekday: [],
          time: '18:00',
          until: null,
        }}
        onChange={onChange}
      />
    )

    expect(screen.getByLabelText(/frequency/i)).toBeInTheDocument()
  })

  it('calls onChange when frequency changes', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(
      <RecurrenceBuilder
        value={{
          frequency: 'weekly',
          interval: 1,
          byweekday: [],
          time: '18:00',
          until: null,
        }}
        onChange={onChange}
      />
    )

    const select = screen.getByLabelText(/frequency/i)
    await user.selectOptions(select, 'biweekly')

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ frequency: 'biweekly' })
    )
  })

  it('renders day checkboxes for weekly patterns', () => {
    const onChange = vi.fn()
    render(
      <RecurrenceBuilder
        value={{
          frequency: 'weekly',
          interval: 1,
          byweekday: ['TU'],
          time: '18:00',
          until: null,
        }}
        onChange={onChange}
      />
    )

    expect(screen.getByLabelText(/monday/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/tuesday/i)).toBeChecked()
  })

  it('toggles day checkbox on click', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(
      <RecurrenceBuilder
        value={{
          frequency: 'weekly',
          interval: 1,
          byweekday: ['TU'],
          time: '18:00',
          until: null,
        }}
        onChange={onChange}
      />
    )

    // Check a day (add to byweekday)
    const monday = screen.getByLabelText(/monday/i)
    await user.click(monday)
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ byweekday: ['TU', 'MO'] })
    )

    // Uncheck a day (remove from byweekday)
    onChange.mockClear()
    const tuesday = screen.getByLabelText(/tuesday/i)
    await user.click(tuesday)
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ byweekday: [] })
    )
  })

  it('updates time on input change', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(
      <RecurrenceBuilder
        value={{
          frequency: 'weekly',
          interval: 1,
          byweekday: [],
          time: '18:00',
          until: null,
        }}
        onChange={onChange}
      />
    )

    const timeInput = screen.getByLabelText(/time/i)
    await user.click(timeInput)
    await user.keyboard('14:30')

    // onChange is called with updated time value
    expect(onChange).toHaveBeenCalled()
    const calls = onChange.mock.calls
    const hasTimeChange = calls.some((call) => call[0].time !== '18:00')
    expect(hasTimeChange).toBe(true)
  })

  it('hides day checkboxes for monthly frequency', () => {
    const onChange = vi.fn()
    render(
      <RecurrenceBuilder
        value={{
          frequency: 'monthly',
          interval: 1,
          byweekday: [],
          time: '18:00',
          until: null,
        }}
        onChange={onChange}
      />
    )

    expect(screen.queryByLabelText(/monday/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/tuesday/i)).not.toBeInTheDocument()
  })

  it('sets interval to 2 for biweekly frequency', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(
      <RecurrenceBuilder
        value={{
          frequency: 'weekly',
          interval: 1,
          byweekday: [],
          time: '18:00',
          until: null,
        }}
        onChange={onChange}
      />
    )

    const select = screen.getByLabelText(/frequency/i)
    await user.selectOptions(select, 'biweekly')

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        frequency: 'biweekly',
        interval: 2,
      })
    )
  })
})
