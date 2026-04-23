import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// ── Stubs ─────────────────────────────────────────────────────────────────────
// jsdom does not implement matchMedia — we provide a configurable stub here.
let _prefersDark = false
// Listeners registered via mql.addEventListener('change', fn) during a test.
let _mqlListeners: Array<(e: Partial<MediaQueryListEvent>) => void> = []
const matchMediaStub = vi.fn().mockImplementation((query: string) => ({
  matches: query === '(prefers-color-scheme: dark)' ? _prefersDark : false,
  addEventListener: vi.fn((_type: string, listener: (e: Partial<MediaQueryListEvent>) => void) => {
    _mqlListeners.push(listener)
  }),
  removeEventListener: vi.fn(
    (_type: string, listener: (e: Partial<MediaQueryListEvent>) => void) => {
      _mqlListeners = _mqlListeners.filter((l) => l !== listener)
    }
  ),
}))

const localStorageStub = {
  store: {} as Record<string, string>,
  getItem: vi.fn((key: string) => localStorageStub.store[key] ?? null),
  setItem: vi.fn((key: string, val: string) => {
    localStorageStub.store[key] = val
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageStub.store[key]
  }),
  clear: vi.fn(() => {
    localStorageStub.store = {}
  }),
}

// Install stubs via vi.stubGlobal so vitest restores originals after this file runs,
// preventing cross-file global pollution in shared worker pools.
beforeAll(() => {
  vi.stubGlobal('matchMedia', matchMediaStub)
  vi.stubGlobal('localStorage', localStorageStub)
})

afterAll(() => {
  vi.unstubAllGlobals()
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useTheme', () => {
  beforeEach(() => {
    // Reset state before each test
    localStorageStub.clear()
    vi.clearAllMocks()
    _prefersDark = false
    _mqlListeners = []
    document.documentElement.classList.remove('dark')
  })

  afterEach(() => {
    document.documentElement.classList.remove('dark')
  })

  // Dynamically import after stubs are set so the module reads current values
  async function importHook() {
    // Bust Vitest module cache so getInitialTheme() re-runs with fresh stubs
    const mod = await import('../src/hooks/useTheme.js?t=' + Date.now())
    return mod.useTheme
  }

  it('reads "light" from localStorage and starts in light mode', async () => {
    localStorageStub.store['theme'] = 'light'
    const useTheme = await importHook()
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('reads "dark" from localStorage and starts in dark mode', async () => {
    localStorageStub.store['theme'] = 'dark'
    const useTheme = await importHook()
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('falls back to matchMedia dark when localStorage is empty', async () => {
    _prefersDark = true
    const useTheme = await importHook()
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('falls back to light when localStorage is empty and matchMedia is not dark', async () => {
    _prefersDark = false
    const useTheme = await importHook()
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('toggleTheme switches from light to dark', async () => {
    localStorageStub.store['theme'] = 'light'
    const useTheme = await importHook()
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.toggleTheme()
    })

    expect(result.current.theme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('toggleTheme switches from dark to light', async () => {
    localStorageStub.store['theme'] = 'dark'
    const useTheme = await importHook()
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.toggleTheme()
    })

    expect(result.current.theme).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('persists theme change to localStorage on toggle', async () => {
    localStorageStub.store['theme'] = 'light'
    const useTheme = await importHook()
    const { result } = renderHook(() => useTheme())

    act(() => {
      result.current.toggleTheme()
    })

    expect(localStorageStub.setItem).toHaveBeenCalledWith('theme', 'dark')
  })

  it('handles localStorage.getItem throwing without crashing', async () => {
    localStorageStub.getItem.mockImplementationOnce(() => {
      throw new Error('storage disabled')
    })
    _prefersDark = false
    const useTheme = await importHook()
    // Should not throw; falls back to matchMedia
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('light')
  })

  it('updates theme when OS dark-mode changes and no localStorage key is set', async () => {
    _prefersDark = false
    const useTheme = await importHook()
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('light')

    // Simulate the OS switching to dark mode
    act(() => {
      _mqlListeners.forEach((fn) => fn({ matches: true }))
    })

    expect(result.current.theme).toBe('dark')
  })

  it('ignores OS dark-mode change when user has an explicit localStorage preference', async () => {
    localStorageStub.store['theme'] = 'light'
    const useTheme = await importHook()
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('light')

    // Simulate OS switching to dark — should be ignored because user set 'light'
    act(() => {
      _mqlListeners.forEach((fn) => fn({ matches: true }))
    })

    expect(result.current.theme).toBe('light')
  })
})
