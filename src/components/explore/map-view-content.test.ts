import { describe, expect, it } from 'vitest'
import { createMarkerContent } from './map-view-content'

describe('createMarkerContent', () => {
  it('renders marker labels as text instead of HTML', () => {
    const label = '<img src=x onerror="alert(1)">Unsafe club'
    const marker = createMarkerContent('pin is-club', label)

    expect(marker.querySelector('.pin-label')).toHaveTextContent(label)
    expect(marker.querySelector('img')).not.toBeInTheDocument()
  })
})
