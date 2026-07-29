import type { Filters } from './filter-panel'

export type Mode = 'runs' | 'clubs'
export type DetailRoute =
  | { kind: 'run'; id: string }
  | { kind: 'club'; slug: string }

export function parseDay(params: URLSearchParams): number {
  const day = parseInt(params.get('day') ?? '0')
  return isNaN(day) || day < 0 || day > 6 ? 0 : day
}

export function parseModeFromPath(pathname: string): Mode {
  const section = pathname.split('/')[2]
  return section === 'clubs' || section === 'club' ? 'clubs' : 'runs'
}

export function parseRouteSelection(pathname: string) {
  const [, , section, id] = pathname.split('/')
  if (!id) return { runId: null, clubSlug: null }
  if (section === 'run') {
    return { runId: decodeURIComponent(id), clubSlug: null }
  }
  if (section === 'club' || section === 'clubs') {
    return { runId: null, clubSlug: decodeURIComponent(id) }
  }
  return { runId: null, clubSlug: null }
}

export function detailKey(detail: DetailRoute): string
export function detailKey(detail: DetailRoute | null): string | null
export function detailKey(detail: DetailRoute | null): string | null {
  if (!detail) return null
  return detail.kind === 'run' ? `run:${detail.id}` : `club:${detail.slug}`
}

export function parseFilters(params: URLSearchParams): Filters {
  return {
    types: params.get('types')?.split(',').filter(Boolean) ?? [],
    vibes: params.get('vibes')?.split(',').filter(Boolean) ?? [],
    pace: params.get('pace') ?? 'any',
    beginner: params.get('beginner') === '1',
    tod: params.get('tod') ?? 'all',
  }
}

export function dayOffsetFromRunId(id: string | null): number | null {
  const date = id?.match(/(?:--|:)(\d{4}-\d{2}-\d{2})$/)?.[1]
  if (!date) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(`${date}T00:00:00`)
  const offset = Math.round((target.getTime() - today.getTime()) / 86400000)
  return offset >= 0 && offset <= 6 ? offset : null
}

export function buildQs(
  day: number,
  filters: Filters,
  selected: { runId?: string | null; clubSlug?: string | null } = {}
): string {
  const params = new URLSearchParams()
  if (day !== 0) params.set('day', String(day))
  if (filters.types.length) params.set('types', filters.types.join(','))
  if (filters.vibes.length) params.set('vibes', filters.vibes.join(','))
  if (filters.pace !== 'any') params.set('pace', filters.pace)
  if (filters.beginner) params.set('beginner', '1')
  if (filters.tod !== 'all') params.set('tod', filters.tod)
  if (selected.runId) params.set('run', selected.runId)
  if (selected.clubSlug) params.set('club', selected.clubSlug)
  const query = params.toString()
  return query ? `?${query}` : ''
}
