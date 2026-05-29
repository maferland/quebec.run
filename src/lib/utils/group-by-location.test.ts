import { describe, test, expect } from 'vitest'
import { groupByLocation } from './group-by-location'

describe('groupByLocation', () => {
  test('groups items at identical coordinates', () => {
    const items = [
      {
        latitude: 46.7711,
        longitude: -71.2875,
        date: new Date('2026-05-30'),
        id: 'sat',
      },
      {
        latitude: 46.7711,
        longitude: -71.2875,
        date: new Date('2026-05-27'),
        id: 'wed',
      },
      {
        latitude: 46.8139,
        longitude: -71.208,
        date: new Date('2026-05-28'),
        id: 'other',
      },
    ]
    const groups = groupByLocation(items)
    expect(groups).toHaveLength(2)
    const big = groups.find((g) => g.length === 2)!
    expect(big.map((e) => e.id)).toEqual(['wed', 'sat'])
  })

  test('keeps distinct locations distinct', () => {
    const items = [
      {
        latitude: 46.0,
        longitude: -71.0,
        date: new Date('2026-05-01'),
        id: 'a',
      },
      {
        latitude: 46.1,
        longitude: -71.0,
        date: new Date('2026-05-01'),
        id: 'b',
      },
    ]
    expect(groupByLocation(items)).toHaveLength(2)
  })

  test('rounds floats to 6 decimals to handle precision noise', () => {
    const items = [
      {
        latitude: 46.7711000001,
        longitude: -71.2875,
        date: new Date('2026-05-01'),
        id: 'a',
      },
      {
        latitude: 46.7711000002,
        longitude: -71.2875,
        date: new Date('2026-05-02'),
        id: 'b',
      },
    ]
    expect(groupByLocation(items)).toHaveLength(1)
  })

  test('sorts each group by date ascending', () => {
    const items = [
      {
        latitude: 46.0,
        longitude: -71.0,
        date: new Date('2026-06-15'),
        id: 'late',
      },
      {
        latitude: 46.0,
        longitude: -71.0,
        date: new Date('2026-05-01'),
        id: 'early',
      },
    ]
    const [group] = groupByLocation(items)
    expect(group.map((e) => e.id)).toEqual(['early', 'late'])
  })
})
