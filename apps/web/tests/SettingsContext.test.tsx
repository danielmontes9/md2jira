import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { SettingsProvider, useSettings } from '../src/context/SettingsContext.js'

const LS_KEY = 'md2jira-settings'

function wrapper({ children }: { children: ReactNode }) {
  return createElement(SettingsProvider, null, children)
}

beforeEach(() => {
  localStorage.clear()
  // Reset document.lang to a neutral value before each test
  document.documentElement.lang = ''
})

afterEach(() => {
  localStorage.clear()
})

// ── Default state ─────────────────────────────────────────────────────────────

describe('SettingsContext — default state (empty localStorage)', () => {
  it('historyEnabled defaults to true', () => {
    const { result } = renderHook(() => useSettings(), { wrapper })
    expect(result.current.historyEnabled).toBe(true)
  })

  it('maxHistoryEntries defaults to 10', () => {
    const { result } = renderHook(() => useSettings(), { wrapper })
    expect(result.current.maxHistoryEntries).toBe(10)
  })

  it('locale defaults to a valid locale string', () => {
    const { result } = renderHook(() => useSettings(), { wrapper })
    expect(['en', 'es', 'pt', 'fr', 'de']).toContain(result.current.locale)
  })

  it('exposes toggleHistory, setLocale, setMaxHistoryEntries as functions', () => {
    const { result } = renderHook(() => useSettings(), { wrapper })
    expect(typeof result.current.toggleHistory).toBe('function')
    expect(typeof result.current.setLocale).toBe('function')
    expect(typeof result.current.setMaxHistoryEntries).toBe('function')
  })
})

// ── loadSettings from localStorage ────────────────────────────────────────────

describe('SettingsContext — loadSettings from localStorage', () => {
  it('reads historyEnabled: false from localStorage', () => {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({ historyEnabled: false, maxHistoryEntries: 10, locale: 'en' })
    )
    const { result } = renderHook(() => useSettings(), { wrapper })
    expect(result.current.historyEnabled).toBe(false)
  })

  it('reads maxHistoryEntries: 25 from localStorage', () => {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({ historyEnabled: true, maxHistoryEntries: 25, locale: 'en' })
    )
    const { result } = renderHook(() => useSettings(), { wrapper })
    expect(result.current.maxHistoryEntries).toBe(25)
  })

  it('reads maxHistoryEntries: 50 from localStorage', () => {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({ historyEnabled: true, maxHistoryEntries: 50, locale: 'en' })
    )
    const { result } = renderHook(() => useSettings(), { wrapper })
    expect(result.current.maxHistoryEntries).toBe(50)
  })

  it('reads locale "es" from localStorage', () => {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({ historyEnabled: true, maxHistoryEntries: 10, locale: 'es' })
    )
    const { result } = renderHook(() => useSettings(), { wrapper })
    expect(result.current.locale).toBe('es')
  })

  it('reads locale "pt" from localStorage', () => {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({ historyEnabled: true, maxHistoryEntries: 10, locale: 'pt' })
    )
    const { result } = renderHook(() => useSettings(), { wrapper })
    expect(result.current.locale).toBe('pt')
  })

  it('reads locale "fr" from localStorage', () => {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({ historyEnabled: true, maxHistoryEntries: 10, locale: 'fr' })
    )
    const { result } = renderHook(() => useSettings(), { wrapper })
    expect(result.current.locale).toBe('fr')
  })

  it('falls back to DEFAULT maxHistoryEntries (10) when stored value is invalid (e.g. 999)', () => {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({ historyEnabled: true, maxHistoryEntries: 999, locale: 'en' })
    )
    const { result } = renderHook(() => useSettings(), { wrapper })
    expect(result.current.maxHistoryEntries).toBe(10)
  })

  it('falls back to DEFAULT maxHistoryEntries (10) when stored value is a string', () => {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({ historyEnabled: true, maxHistoryEntries: 'twenty', locale: 'en' })
    )
    const { result } = renderHook(() => useSettings(), { wrapper })
    expect(result.current.maxHistoryEntries).toBe(10)
  })

  it('falls back to a valid locale when stored locale is unsupported (e.g. "ja")', () => {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({ historyEnabled: true, maxHistoryEntries: 10, locale: 'ja' })
    )
    const { result } = renderHook(() => useSettings(), { wrapper })
    expect(['en', 'es', 'pt', 'fr', 'de']).toContain(result.current.locale)
  })

  it('falls back to DEFAULT state when localStorage contains malformed JSON', () => {
    localStorage.setItem(LS_KEY, '{{{not-valid-json')
    const { result } = renderHook(() => useSettings(), { wrapper })
    expect(result.current.historyEnabled).toBe(true)
    expect(result.current.maxHistoryEntries).toBe(10)
  })

  it('falls back to historyEnabled: true (DEFAULT) when historyEnabled is not a boolean', () => {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({ historyEnabled: 'yes', maxHistoryEntries: 10, locale: 'en' })
    )
    const { result } = renderHook(() => useSettings(), { wrapper })
    expect(result.current.historyEnabled).toBe(true)
  })
})

// ── Mutations ─────────────────────────────────────────────────────────────────

describe('SettingsContext — mutations', () => {
  it('toggleHistory flips historyEnabled from true to false', () => {
    const { result } = renderHook(() => useSettings(), { wrapper })
    expect(result.current.historyEnabled).toBe(true)
    act(() => result.current.toggleHistory())
    expect(result.current.historyEnabled).toBe(false)
  })

  it('toggleHistory flips historyEnabled from false to true', () => {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({ historyEnabled: false, maxHistoryEntries: 10, locale: 'en' })
    )
    const { result } = renderHook(() => useSettings(), { wrapper })
    act(() => result.current.toggleHistory())
    expect(result.current.historyEnabled).toBe(true)
  })

  it('setLocale updates locale to "es"', () => {
    const { result } = renderHook(() => useSettings(), { wrapper })
    act(() => result.current.setLocale('es'))
    expect(result.current.locale).toBe('es')
  })

  it('setLocale updates locale to "pt"', () => {
    const { result } = renderHook(() => useSettings(), { wrapper })
    act(() => result.current.setLocale('pt'))
    expect(result.current.locale).toBe('pt')
  })

  it('setLocale updates locale to "fr"', () => {
    const { result } = renderHook(() => useSettings(), { wrapper })
    act(() => result.current.setLocale('fr'))
    expect(result.current.locale).toBe('fr')
  })

  it('setMaxHistoryEntries updates to 25', () => {
    const { result } = renderHook(() => useSettings(), { wrapper })
    act(() => result.current.setMaxHistoryEntries(25))
    expect(result.current.maxHistoryEntries).toBe(25)
  })

  it('setMaxHistoryEntries updates to 50', () => {
    const { result } = renderHook(() => useSettings(), { wrapper })
    act(() => result.current.setMaxHistoryEntries(50))
    expect(result.current.maxHistoryEntries).toBe(50)
  })

  it('mutations persist to localStorage immediately', () => {
    const { result } = renderHook(() => useSettings(), { wrapper })
    act(() => result.current.setLocale('pt'))
    const stored = JSON.parse(localStorage.getItem(LS_KEY) ?? '{}')
    expect(stored.locale).toBe('pt')
  })

  it('toggleHistory persists the updated value to localStorage', () => {
    const { result } = renderHook(() => useSettings(), { wrapper })
    act(() => result.current.toggleHistory())
    const stored = JSON.parse(localStorage.getItem(LS_KEY) ?? '{}')
    expect(stored.historyEnabled).toBe(false)
  })
})

// ── document.lang sync ────────────────────────────────────────────────────────

describe('SettingsContext — document.documentElement.lang sync', () => {
  it('sets document.lang to the initial locale on mount', () => {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({ historyEnabled: true, maxHistoryEntries: 10, locale: 'es' })
    )
    renderHook(() => useSettings(), { wrapper })
    expect(document.documentElement.lang).toBe('es')
  })

  it('updates document.lang when setLocale is called', () => {
    const { result } = renderHook(() => useSettings(), { wrapper })
    act(() => result.current.setLocale('fr'))
    expect(document.documentElement.lang).toBe('fr')
  })
})

// ── Error boundary ────────────────────────────────────────────────────────────

describe('useSettings — usage outside Provider', () => {
  it('throws when called outside a SettingsProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useSettings())).toThrow(
      'useSettings must be used inside <SettingsProvider>'
    )
    consoleError.mockRestore()
  })
})
