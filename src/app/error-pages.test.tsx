import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@/lib/test-utils'
import NotFound from './not-found'
import GlobalError from './global-error'

const captureException = vi.hoisted(() => vi.fn())
vi.mock('@sentry/nextjs', () => ({ captureException }))

describe('root not-found', () => {
  it('renders the designed shell for URLs matching no route', () => {
    const { container } = render(<NotFound />)

    expect(screen.getByRole('heading')).toHaveTextContent(
      'Tu as pris un détour'
    )
    expect(container.querySelector('.qr-root.qr-error-root')).not.toBeNull()
    expect(container.querySelector('.qr-error-runner')).not.toBeNull()
  })

  it('links out with plain anchors, since there is no router context here', () => {
    render(<NotFound />)

    expect(
      screen.getByRole('link', { name: /Retour à l'accueil/ })
    ).toHaveAttribute('href', '/')
    expect(
      screen.getByRole('link', { name: 'Voir les clubs' })
    ).toHaveAttribute('href', '/clubs')
  })
})

describe('global-error', () => {
  it('reports the crash to Sentry', () => {
    const error = new Error('root layout blew up')
    render(<GlobalError error={error} />)

    expect(captureException).toHaveBeenCalledWith(error)
  })

  it('stays self-contained and bilingual', () => {
    render(<GlobalError error={new Error('boom')} />)

    expect(screen.getByRole('heading')).toHaveTextContent('On a frappé le mur')
    expect(screen.getByText(/We hit the wall/)).toBeInTheDocument()
  })
})
