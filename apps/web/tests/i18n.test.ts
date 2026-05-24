import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { t, useT, useTI, useTP } from '../src/i18n/index.js'
import { en } from '../src/i18n/en.js'
import { es } from '../src/i18n/es.js'
import { pt } from '../src/i18n/pt.js'
import { fr } from '../src/i18n/fr.js'

// Mutable locale — lets individual hook tests switch locale without a Provider tree.
let mockLocale: 'en' | 'es' | 'pt' | 'fr' = 'en'

vi.mock('../src/context/SettingsContext.js', () => ({
  useSettings: () => ({
    locale: mockLocale,
    historyEnabled: true,
    maxHistoryEntries: 10 as const,
    toggleHistory: () => {},
    setMaxHistoryEntries: () => {},
    setLocale: () => {},
  }),
}))

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

  it('fr.ts has exactly the same keys as en.ts', () => {
    expect(Object.keys(fr).sort()).toEqual(EN_KEYS)
  })

  it('all fr.ts values are non-empty strings', () => {
    for (const [key, value] of Object.entries(fr)) {
      expect(typeof value, `fr.${key}`).toBe('string')
      expect((value as string).length, `fr.${key}`).toBeGreaterThan(0)
    }
  })

  it('es.ts has at least 50% of values different from en.ts', () => {
    const enEntries = Object.entries(en)
    const different = enEntries.filter(([key, enVal]) => es[key as keyof typeof en] !== enVal)
    expect(different.length).toBeGreaterThanOrEqual(Math.ceil(enEntries.length / 2))
  })

  it('pt.ts has at least 50% of values different from en.ts', () => {
    const enEntries = Object.entries(en)
    const different = enEntries.filter(([key, enVal]) => pt[key as keyof typeof en] !== enVal)
    expect(different.length).toBeGreaterThanOrEqual(Math.ceil(enEntries.length / 2))
  })

  it('fr.ts has at least 50% of values different from en.ts', () => {
    const enEntries = Object.entries(en)
    const different = enEntries.filter(([key, enVal]) => fr[key as keyof typeof en] !== enVal)
    expect(different.length).toBeGreaterThanOrEqual(Math.ceil(enEntries.length / 2))
  })
})

// ── useTI hook ────────────────────────────────────────────────────────────────

describe('useTI — interpolation hook', () => {
  beforeEach(() => {
    mockLocale = 'en'
  })

  it('replaces a {placeholder} with the given value', () => {
    const { result } = renderHook(() => useTI())
    expect(result.current('selectEntryLabel', { title: 'My Doc' })).toBe('Select "My Doc"')
  })

  it('leaves the token intact when the variable key is absent', () => {
    const { result } = renderHook(() => useTI())
    expect(result.current('selectEntryLabel', {})).toBe('Select "{title}"')
  })

  it('uses the locale-specific dict when locale is "es"', () => {
    mockLocale = 'es'
    const { result } = renderHook(() => useTI())
    expect(result.current('selectEntryLabel', { title: 'Mi Doc' })).toBe('Seleccionar "Mi Doc"')
  })

  it('interpolates the placeholder in renameEntryAction', () => {
    const { result } = renderHook(() => useTI())
    expect(result.current('renameEntryAction', { title: 'Report' })).toBe('Rename "Report"')
  })

  it('interpolates the placeholder in deleteEntryLabel', () => {
    const { result } = renderHook(() => useTI())
    expect(result.current('deleteEntryLabel', { title: 'Draft' })).toBe(
      'Delete "Draft" from history'
    )
  })
})

// ── useTP hook ────────────────────────────────────────────────────────────────

describe('useTP — plural selection hook', () => {
  beforeEach(() => {
    mockLocale = 'en'
  })

  it('returns a string for count=1 in English', () => {
    const { result } = renderHook(() => useTP())
    expect(result.current('historySavedCountOne', 'historySavedCount', 1)).toBe('saved')
  })

  it('returns a string for count=2 in English', () => {
    const { result } = renderHook(() => useTP())
    expect(result.current('historySavedCountOne', 'historySavedCount', 2)).toBe('saved')
  })

  it('returns the otherKey value for count=0 (zero maps to "other" in English)', () => {
    const { result } = renderHook(() => useTP())
    expect(result.current('retriesRemainingOne', 'retriesRemaining', 0)).toBe('remaining')
  })

  it('returns the Spanish singular form when locale is "es" and count is 1', () => {
    mockLocale = 'es'
    const { result } = renderHook(() => useTP())
    expect(result.current('historySavedCountOne', 'historySavedCount', 1)).toBe('guardado')
  })

  it('returns the Spanish plural form when locale is "es" and count is 2', () => {
    mockLocale = 'es'
    const { result } = renderHook(() => useTP())
    expect(result.current('historySavedCountOne', 'historySavedCount', 2)).toBe('guardados')
  })

  it('returns the Spanish singular for retriesRemaining when count is 1', () => {
    mockLocale = 'es'
    const { result } = renderHook(() => useTP())
    expect(result.current('retriesRemainingOne', 'retriesRemaining', 1)).toBe('restante')
  })

  it('returns the Spanish plural for retriesRemaining when count is 0', () => {
    mockLocale = 'es'
    const { result } = renderHook(() => useTP())
    expect(result.current('retriesRemainingOne', 'retriesRemaining', 0)).toBe('restantes')
  })
})

// ── t() standalone function ──────────────────────────────────────────────────

describe('t() — standalone English lookup', () => {
  it('returns the English string for a known key', () => {
    expect(t('offlineBanner')).toBe(en['offlineBanner'])
  })

  it('returns the English string for another key', () => {
    expect(t('markdownPanelLabel')).toBe(en['markdownPanelLabel'])
  })
})

// ── useT() hook ──────────────────────────────────────────────────────────────

describe('useT() — locale-aware lookup hook', () => {
  beforeEach(() => {
    mockLocale = 'en'
  })

  it('returns English strings when locale is "en"', () => {
    mockLocale = 'en'
    const { result } = renderHook(() => useT())
    expect(result.current('offlineBanner')).toBe(en['offlineBanner'])
  })

  it('returns Spanish strings when locale is "es"', () => {
    mockLocale = 'es'
    const { result } = renderHook(() => useT())
    expect(result.current('offlineBanner')).toBe(es['offlineBanner'])
  })

  it('returns Portuguese strings when locale is "pt"', () => {
    mockLocale = 'pt'
    const { result } = renderHook(() => useT())
    expect(result.current('offlineBanner')).toBe(pt['offlineBanner'])
  })

  it('returns French strings when locale is "fr"', () => {
    mockLocale = 'fr'
    const { result } = renderHook(() => useT())
    expect(result.current('offlineBanner')).toBe(fr['offlineBanner'])
  })
})
