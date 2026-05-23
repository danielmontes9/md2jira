import { describe, it, expect } from 'vitest'
import { en } from '../src/i18n/en.js'
import { es } from '../src/i18n/es.js'
import { pt } from '../src/i18n/pt.js'

const EN_KEYS = Object.keys(en).sort()

describe('i18n locale completeness', () => {
  it('es.ts has exactly the same keys as en.ts', () => {
    expect(Object.keys(es).sort()).toEqual(EN_KEYS)
  })

  it('pt.ts has exactly the same keys as en.ts', () => {
    expect(Object.keys(pt).sort()).toEqual(EN_KEYS)
  })

  it('all en.ts values are non-empty strings', () => {
    for (const [key, value] of Object.entries(en)) {
      expect(typeof value, `en.${key}`).toBe('string')
      expect((value as string).length, `en.${key}`).toBeGreaterThan(0)
    }
  })

  it('all es.ts values are non-empty strings', () => {
    for (const [key, value] of Object.entries(es)) {
      expect(typeof value, `es.${key}`).toBe('string')
      expect((value as string).length, `es.${key}`).toBeGreaterThan(0)
    }
  })

  it('all pt.ts values are non-empty strings', () => {
    for (const [key, value] of Object.entries(pt)) {
      expect(typeof value, `pt.${key}`).toBe('string')
      expect((value as string).length, `pt.${key}`).toBeGreaterThan(0)
    }
  })
})
