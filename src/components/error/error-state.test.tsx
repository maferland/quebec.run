import { describe, expect, it } from 'vitest'
import { render, screen } from '@/lib/test-utils'
import { ErrorState, HomeIcon, RetryIcon } from './error-state'

const base = {
  title: 'Tu as pris un détour.',
  lede: 'Cette page n’est pas sur le parcours.',
  meta: 'Erreur 404 · page introuvable',
  actions: <button type="button">Voir les clubs</button>,
}

describe('ErrorState', () => {
  it('renders the copy it is given', () => {
    render(<ErrorState variant="track" {...base} />)

    expect(screen.getByRole('heading')).toHaveTextContent(
      'Tu as pris un détour.'
    )
    expect(screen.getByText(base.meta)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Voir les clubs' })).toBeVisible()
  })

  it('carries qr-root so the scoped design tokens resolve', () => {
    const { container } = render(<ErrorState variant="track" {...base} />)

    expect(container.querySelector('.qr-root.qr-error-root')).not.toBeNull()
  })

  it('marks only the fault variant, which drives the coral treatment', () => {
    const { container: track } = render(
      <ErrorState variant="track" {...base} />
    )
    expect(track.querySelector('.qr-error-root.is-fault')).toBeNull()

    const { container: wall } = render(<ErrorState variant="wall" {...base} />)
    expect(wall.querySelector('.qr-error-root.is-fault')).not.toBeNull()
  })

  it('shows the running-track glyph for 4xx and the wall for 5xx', () => {
    const { container: track } = render(
      <ErrorState variant="track" {...base} />
    )
    expect(track.querySelector('.qr-error-runner')).not.toBeNull()
    expect(track.querySelector('.qr-error-bolt')).toBeNull()

    const { container: wall } = render(<ErrorState variant="wall" {...base} />)
    expect(wall.querySelector('.qr-error-bolt')).not.toBeNull()
    expect(wall.querySelector('.qr-error-runner')).toBeNull()
  })

  it('omits the quip slot when none is passed', () => {
    const { container } = render(<ErrorState variant="wall" {...base} />)

    expect(container.querySelector('.qr-error-quip')).toBeNull()
  })
})

describe('error icons', () => {
  it('renders decorative icons that screen readers skip', () => {
    const { container } = render(
      <ErrorState
        variant="track"
        {...base}
        actions={
          <>
            <HomeIcon />
            <RetryIcon />
          </>
        }
      />
    )

    const icons = container.querySelectorAll('.qr-error-actions svg')
    expect(icons).toHaveLength(2)
    icons.forEach((icon) => {
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    })
  })
})
