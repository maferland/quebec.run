/**
 * JavaScript Date.getDay() values: 0 = Sunday, 1 = Monday, ..., 6 = Saturday.
 * For display we order weekdays Mon → Sun (Quebec convention).
 */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

export const WEEKDAYS_MON_FIRST: readonly Weekday[] = [1, 2, 3, 4, 5, 6, 0]

export function compareWeekdays(a: Weekday, b: Weekday): number {
  return WEEKDAYS_MON_FIRST.indexOf(a) - WEEKDAYS_MON_FIRST.indexOf(b)
}
