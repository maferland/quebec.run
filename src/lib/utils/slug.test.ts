import { describe, it, expect } from 'vitest'
import { createSlug, createUniqueSlug } from './slug'

describe('createSlug', () => {
  it('converts text to lowercase slug', () => {
    expect(createSlug('Hello World')).toBe('hello-world')
    expect(createSlug('6AM Club')).toBe('6am-club')
  })

  it('handles special characters', () => {
    expect(createSlug('Club de Montréal & Québec!')).toBe(
      'club-de-montreal-quebec'
    )
    expect(createSlug('Running @ Dawn')).toBe('running-dawn')
  })

  it('handles multiple spaces and hyphens', () => {
    expect(createSlug('Club   with    spaces')).toBe('club-with-spaces')
    expect(createSlug('Club--with--hyphens')).toBe('club-with-hyphens')
  })

  it('removes leading and trailing hyphens', () => {
    expect(createSlug('-Club Name-')).toBe('club-name')
    expect(createSlug('---Club---')).toBe('club')
  })

  it('limits length to 50 characters', () => {
    const longName = 'This is a very very very very very very long club name'
    const slug = createSlug(longName)
    expect(slug.length).toBeLessThanOrEqual(50)
    expect(slug).toBe('this-is-a-very-very-very-very-very-very-long-club')
  })

  it('handles empty string', () => {
    expect(createSlug('')).toBe('')
    expect(createSlug('   ')).toBe('')
  })

  it('handles French characters', () => {
    expect(createSlug('Québec Running Club')).toBe('quebec-running-club')
    expect(createSlug('Club de course à Montréal')).toBe(
      'club-de-course-a-montreal'
    )
  })
})

describe('createUniqueSlug', () => {
  it('returns original slug if not in existing list', () => {
    expect(createUniqueSlug('club-name', [])).toBe('club-name')
    expect(createUniqueSlug('club-name', ['other-club', 'another-club'])).toBe(
      'club-name'
    )
  })

  it('appends number if slug exists', () => {
    expect(createUniqueSlug('club-name', ['club-name'])).toBe('club-name-2')
    expect(createUniqueSlug('club-name', ['club-name', 'club-name-2'])).toBe(
      'club-name-3'
    )
  })

  it('finds next available number', () => {
    const existing = ['club-name', 'club-name-2', 'club-name-4']
    expect(createUniqueSlug('club-name', existing)).toBe('club-name-3')
  })

  it('handles large numbers', () => {
    const existing = [
      'club-name',
      'club-name-2',
      'club-name-3',
      'club-name-4',
      'club-name-5',
    ]
    expect(createUniqueSlug('club-name', existing)).toBe('club-name-6')
  })
})
