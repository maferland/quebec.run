import { render, screen, fireEvent } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { vi } from 'vitest'
import { StickySearchBar } from './sticky-search-bar'

const messages = {
  home: {
    search: {
      title: 'Find Your Next Run',
      placeholder: 'Search for events or clubs...',
      browseAll: 'Browse All Events',
    },
  },
}

describe('StickySearchBar', () => {
  it('is not sticky when empty', () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <StickySearchBar value="" onChange={vi.fn()} />
      </NextIntlClientProvider>
    )
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).not.toContain('sticky')
  })

  it('becomes sticky when user types', () => {
    const { container } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <StickySearchBar value="test" onChange={vi.fn()} />
      </NextIntlClientProvider>
    )
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('sticky')
    expect(wrapper.className).toContain('top-20')
  })

  it('shows title when empty', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <StickySearchBar value="" onChange={vi.fn()} />
      </NextIntlClientProvider>
    )
    expect(screen.getByText('Find Your Next Run')).toBeInTheDocument()
  })

  it('hides title when searching', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <StickySearchBar value="test" onChange={vi.fn()} />
      </NextIntlClientProvider>
    )
    expect(screen.queryByText('Find Your Next Run')).not.toBeInTheDocument()
  })

  it('calls onChange when input changes', () => {
    const handleChange = vi.fn()
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <StickySearchBar value="" onChange={handleChange} />
      </NextIntlClientProvider>
    )
    const input = screen.getByPlaceholderText('Search for events or clubs...')
    fireEvent.change(input, { target: { value: 'test' } })
    expect(handleChange).toHaveBeenCalledWith('test')
  })
})
