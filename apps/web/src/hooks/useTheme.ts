import { useState, useEffect, useCallback, useRef } from 'react'
type Theme = 'light' | 'dark'

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem('theme')
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // localStorage may throw in sandboxed iframes or when storage is disabled
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** Returns true if the user has an explicit theme stored in localStorage. */
function hasStoredPreference(): boolean {
  try {
    return localStorage.getItem('theme') !== null
  } catch {
    return false
  }
}

/** Manages the light/dark theme, persisting the preference to localStorage. */
export function useTheme(): { theme: Theme; toggleTheme: () => void } {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)
  // Track whether the user has explicitly chosen a theme (either stored from a
  // previous session or toggled during this session). When true, OS-level
  // dark/light changes are ignored. Using a ref so the change listener doesn't
  // need to be re-registered when the flag flips.
  const userSetRef = useRef<boolean>(hasStoredPreference())

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem('theme', theme)
    } catch {
      // localStorage may not be available in sandboxed iframes
    }
  }, [theme])

  // Follow OS-level dark/light changes only when the user hasn't manually set
  // a preference (userSetRef stays false until the first toggleTheme() call or
  // until a stored preference exists at startup).
  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      if (userSetRef.current) return
      setTheme(e.matches ? 'dark' : 'light')
    }
    mql.addEventListener('change', handleChange)
    return () => mql.removeEventListener('change', handleChange)
  }, [])

  const toggleTheme = useCallback(() => {
    userSetRef.current = true
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  return { theme, toggleTheme }
}
