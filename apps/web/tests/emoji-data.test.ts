import { describe, it, expect } from 'vitest'
import { EMOJI_CATEGORIES } from '../src/components/jira-output/emoji-data.js'

describe('emoji-data', () => {
  it('EMOJI_CATEGORIES is a non-null object', () => {
    expect(EMOJI_CATEGORIES).toBeDefined()
    expect(typeof EMOJI_CATEGORIES).toBe('object')
    expect(EMOJI_CATEGORIES).not.toBeNull()
  })

  it('has at least one category', () => {
    expect(Object.keys(EMOJI_CATEGORIES).length).toBeGreaterThan(0)
  })

  it('includes the Frequent category', () => {
    expect(EMOJI_CATEGORIES).toHaveProperty('Frequent')
    expect(Array.isArray(EMOJI_CATEGORIES.Frequent)).toBe(true)
  })

  it('all categories contain only non-empty strings', () => {
    for (const [category, emojis] of Object.entries(EMOJI_CATEGORIES)) {
      expect(Array.isArray(emojis), `${category} should be an array`).toBe(true)
      for (const emoji of emojis) {
        expect(typeof emoji, `${category}: entry should be a string`).toBe('string')
        expect(emoji.length, `${category}: entry should not be empty`).toBeGreaterThan(0)
      }
    }
  })

  it('Frequent category has meaningful entries (>= 5)', () => {
    expect(EMOJI_CATEGORIES.Frequent.length).toBeGreaterThanOrEqual(5)
  })

  it('all category names are non-empty strings', () => {
    for (const key of Object.keys(EMOJI_CATEGORIES)) {
      expect(typeof key).toBe('string')
      expect(key.length).toBeGreaterThan(0)
    }
  })
})
