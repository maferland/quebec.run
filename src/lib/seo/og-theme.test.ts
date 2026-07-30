import { describe, expect, it } from 'vitest'
import { truncateForCard } from './og-theme'

describe('truncateForCard', () => {
  it('returns text unchanged when within the limit', () => {
    expect(truncateForCard('Sunday Long Run', 70)).toBe('Sunday Long Run')
  })

  it('clips long text at the last whole word and appends an ellipsis', () => {
    const text =
      'A very long group run description that goes well past the card limit'
    expect(truncateForCard(text, 30)).toBe('A very long group run…')
  })

  it('hard-clips when the first word already exceeds the limit', () => {
    expect(truncateForCard('Supercalifragilisticexpialidocious', 10)).toBe(
      'Supercalif…'
    )
  })
})
