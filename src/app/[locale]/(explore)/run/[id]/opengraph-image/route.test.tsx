import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactElement } from 'react'
import { getEventById } from '@/lib/services/events'
import { GET } from './route'

const captured: { element?: ReactElement } = {}

vi.mock('next/og', () => ({
  ImageResponse: class {
    constructor(element: ReactElement) {
      captured.element = element
    }
  },
}))

vi.mock('@/lib/services/events', () => ({ getEventById: vi.fn() }))

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(async ({ locale }: { locale: string }) => {
    const kickers: Record<string, string> = {
      en: 'Group run in Quebec City',
      fr: 'Sortie de course à Québec',
    }
    return () => kickers[locale]
  }),
}))

const event = {
  id: 'club-slug-run-slug--2026-03-08',
  title: 'Sunday Long Run',
  date: new Date('2026-03-08T12:00:00Z'),
  time: '08:30',
  club: { name: 'Test Club', slug: 'club-slug' },
} as Awaited<ReturnType<typeof getEventById>>

async function renderCard(
  locale: string,
  id = 'club-slug-run-slug--2026-03-08'
) {
  await GET(new Request('https://www.quebec.run'), {
    params: Promise.resolve({ locale, id }),
  })
  if (!captured.element) throw new Error('no card rendered')
  return renderToStaticMarkup(captured.element)
}

beforeEach(() => {
  captured.element = undefined
})

describe('run opengraph image', () => {
  it.each([
    ['en', 'Group run in Quebec City', 'Sunday, March 8'],
    ['fr', 'Sortie de course à Québec', 'dimanche 8 mars'],
  ])('renders the event card in %s', async (locale, kicker, dateLabel) => {
    vi.mocked(getEventById).mockResolvedValue(event)

    const markup = await renderCard(locale)

    expect(getEventById).toHaveBeenCalledWith({
      data: { id: 'club-slug-run-slug--2026-03-08' },
    })
    expect(markup).toContain('Sunday Long Run')
    expect(markup).toContain('Test Club')
    expect(markup).toContain(kicker)
    expect(markup).toContain(dateLabel)
    expect(markup).toContain('08:30')
  })

  it.each([
    ['a missing event', null],
    ['an event without a club', { ...event, club: null }],
  ])('404s for %s', async (_case, resolved) => {
    vi.mocked(getEventById).mockResolvedValue(
      resolved as Awaited<ReturnType<typeof getEventById>>
    )

    const response = await GET(new Request('https://www.quebec.run'), {
      params: Promise.resolve({ locale: 'en', id: 'nope' }),
    })

    expect(response.status).toBe(404)
    expect(captured.element).toBeUndefined()
  })
})
