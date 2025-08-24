import { describe, it, expect } from 'vitest'
import { render, screen } from '@/lib/test-utils'
import { Tag } from './tag'

describe('Tag', () => {
  it('renders children correctly', () => {
    render(<Tag variant="date">Test content</Tag>)
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('applies correct variant styles', () => {
    const { rerender } = render(<Tag variant="date">Date tag</Tag>)
    const tag = screen.getByText('Date tag')
    expect(tag).toHaveClass('bg-gray-200', 'text-gray-700')

    rerender(<Tag variant="time">Time tag</Tag>)
    const timeTag = screen.getByText('Time tag')
    expect(timeTag).toHaveClass('text-white', 'bg-blue-600')
  })

  it('applies base classes to all variants', () => {
    render(<Tag variant="distance">Distance tag</Tag>)
    const tag = screen.getByText('Distance tag')
    expect(tag).toHaveClass(
      'px-2',
      'py-1',
      'text-xs',
      'font-medium',
      'rounded-md'
    )
  })

  it('accepts custom className', () => {
    render(
      <Tag variant="pace" className="custom-class">
        Pace tag
      </Tag>
    )
    const tag = screen.getByText('Pace tag')
    expect(tag).toHaveClass('custom-class')
  })

  it('renders all variants with correct colors', () => {
    render(
      <div>
        <Tag variant="date">Date</Tag>
        <Tag variant="distance">Distance</Tag>
        <Tag variant="pace">Pace</Tag>
        <Tag variant="time">Time</Tag>
        <Tag variant="training">Training</Tag>
        <Tag variant="social">Social</Tag>
      </div>
    )

    expect(screen.getByText('Date')).toHaveClass('bg-gray-200', 'text-gray-700')
    expect(screen.getByText('Distance')).toHaveClass(
      'bg-green-100',
      'text-green-700'
    )
    expect(screen.getByText('Pace')).toHaveClass(
      'bg-yellow-100',
      'text-yellow-700'
    )
    expect(screen.getByText('Time')).toHaveClass('text-white', 'bg-blue-600')
    expect(screen.getByText('Training')).toHaveClass(
      'bg-purple-100',
      'text-purple-700'
    )
    expect(screen.getByText('Social')).toHaveClass(
      'bg-pink-100',
      'text-pink-700'
    )
  })
})
