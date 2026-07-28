import { describe, expect, it } from 'vitest'
import { mapInsets, RAIL_WIDTH } from './explore-panels'

const inset = (over: Partial<Parameters<typeof mapInsets>[0]> = {}) =>
  mapInsets({
    desktop: false,
    containerHeight: 1000,
    sheetHeight: 600,
    detailOpen: false,
    ...over,
  })

describe('mapInsets', () => {
  it('clears the rail on desktop and ignores the sheet', () => {
    expect(inset({ desktop: true })).toEqual({
      left: RAIL_WIDTH + 24,
      top: 24,
      bottom: 24,
    })
  })

  it('keeps the desktop insets even with a detail panel open', () => {
    expect(inset({ desktop: true, detailOpen: true })).toEqual(
      inset({ desktop: true })
    )
  })

  it('reserves the sheet height on mobile', () => {
    expect(inset()).toEqual({ left: 0, top: 76, bottom: 600 })
  })

  it('tracks the sheet as it is dragged', () => {
    expect(inset({ sheetHeight: 930 }).bottom).toBe(930)
  })

  it('leaves a band of map visible when a detail panel is open', () => {
    // 30% of 1000 sits inside the 220..300 clamp
    expect(inset({ detailOpen: true })).toEqual({
      left: 0,
      top: 76,
      bottom: 700,
    })
  })

  it.each([
    { containerHeight: 500, expected: 280, note: 'clamped up to 220 visible' },
    { containerHeight: 2000, expected: 1700, note: 'clamped down to 300' },
  ])('clamps the visible band when $note', ({ containerHeight, expected }) => {
    expect(inset({ containerHeight, detailOpen: true }).bottom).toBe(expected)
  })

  it('never returns a negative bottom inset', () => {
    expect(inset({ containerHeight: 0, detailOpen: true }).bottom).toBe(0)
  })
})
