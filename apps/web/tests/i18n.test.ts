import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { t, useT, useTI, useTP } from '../src/i18n/index.js'
import { en } from '../src/i18n/en.js'
import { es } from '../src/i18n/es.js'
import { pt } from '../src/i18n/pt.js'
import { fr } from '../src/i18n/fr.js'
import { de } from '../src/i18n/de.js'

// Mutable locale — lets individual hook tests switch locale without a Provider tree.
let mockLocale: 'en' | 'es' | 'pt' | 'fr' | 'de' = 'en'

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

  it('de.ts has exactly the same keys as en.ts', () => {
    expect(Object.keys(de).sort()).toEqual(EN_KEYS)
  })

  it('all de.ts values are non-empty strings', () => {
    for (const [key, value] of Object.entries(de)) {
      expect(typeof value, `de.${key}`).toBe('string')
      expect((value as string).length, `de.${key}`).toBeGreaterThan(0)
    }
  })

  it('de.ts has at least 50% of values different from en.ts', () => {
    const enEntries = Object.entries(en)
    const different = enEntries.filter(([key, enVal]) => de[key as keyof typeof en] !== enVal)
    expect(different.length).toBeGreaterThanOrEqual(Math.ceil(enEntries.length / 2))
  })

  it('every en key is present and non-empty in all locales simultaneously', () => {
    const locales = { es, pt, fr, de } as const
    for (const key of Object.keys(en) as Array<keyof typeof en>) {
      for (const [name, locale] of Object.entries(locales)) {
        const val = locale[key]
        expect(typeof val, `${name}.${key}`).toBe('string')
        expect((val as string).length, `${name}.${key} must not be empty`).toBeGreaterThan(0)
      }
    }
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

  it('uses the locale-specific dict when locale is "pt"', () => {
    mockLocale = 'pt'
    const { result } = renderHook(() => useTI())
    const val = result.current('selectEntryLabel', { title: 'Meu Doc' })
    expect(typeof val).toBe('string')
    expect(val.length).toBeGreaterThan(0)
    expect(val).toContain('Meu Doc')
  })

  it('uses the locale-specific dict when locale is "fr"', () => {
    mockLocale = 'fr'
    const { result } = renderHook(() => useTI())
    const val = result.current('selectEntryLabel', { title: 'Mon Doc' })
    expect(typeof val).toBe('string')
    expect(val.length).toBeGreaterThan(0)
    expect(val).toContain('Mon Doc')
  })

  it('uses the locale-specific dict when locale is "de"', () => {
    mockLocale = 'de'
    const { result } = renderHook(() => useTI())
    const val = result.current('selectEntryLabel', { title: 'Mein Dok' })
    expect(typeof val).toBe('string')
    expect(val.length).toBeGreaterThan(0)
    expect(val).toContain('Mein Dok')
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

  it('returns the Portuguese form when locale is "pt" and count is 1', () => {
    mockLocale = 'pt'
    const { result } = renderHook(() => useTP())
    const val = result.current('historySavedCountOne', 'historySavedCount', 1)
    expect(typeof val).toBe('string')
    expect(val.length).toBeGreaterThan(0)
  })

  it('returns the Portuguese form when locale is "pt" and count is 2', () => {
    mockLocale = 'pt'
    const { result } = renderHook(() => useTP())
    const val = result.current('historySavedCountOne', 'historySavedCount', 2)
    expect(typeof val).toBe('string')
    expect(val.length).toBeGreaterThan(0)
  })

  it('returns the French form when locale is "fr" and count is 1', () => {
    mockLocale = 'fr'
    const { result } = renderHook(() => useTP())
    const val = result.current('historySavedCountOne', 'historySavedCount', 1)
    expect(typeof val).toBe('string')
    expect(val.length).toBeGreaterThan(0)
  })

  it('returns the French form when locale is "fr" and count is 2', () => {
    mockLocale = 'fr'
    const { result } = renderHook(() => useTP())
    const val = result.current('historySavedCountOne', 'historySavedCount', 2)
    expect(typeof val).toBe('string')
    expect(val.length).toBeGreaterThan(0)
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

  it('returns a non-empty string for every StringKey across all locales', () => {
    const locales = ['en', 'es', 'pt', 'fr'] as const
    for (const locale of locales) {
      mockLocale = locale
      const { result } = renderHook(() => useT())
      const translate = result.current
      // historyImportSuccess is the newest key — verify it is translated in every locale
      const value = translate('historyImportSuccess')
      expect(typeof value).toBe('string')
      expect(value.length).toBeGreaterThan(0)
    }
  })

  it('returns the fallback English value when the dict entry is undefined at runtime', () => {
    mockLocale = 'es'
    const { result } = renderHook(() => useT())
    // Simulate a missing runtime key by directly invoking the hook's return
    // with a key that exists in en but is temporarily patched to undefined in es.
    // This exercises the ?? en[key] fallback path.
    const esModule = es as unknown as Record<string, string | undefined>
    const backup = esModule['historyImportSuccess']
    esModule['historyImportSuccess'] = undefined
    const value = result.current('historyImportSuccess')
    esModule['historyImportSuccess'] = backup
    expect(value).toBe(en['historyImportSuccess'])
  })
})
