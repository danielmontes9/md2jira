import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

const LS_KEY = 'md2jira-settings'

/** Allowed values for the history-size limit stored in Settings. */
export type MaxHistoryEntries = 10 | 25 | 50 | 100

/** Supported UI locales. */
export type Locale = 'en' | 'es' | 'pt' | 'fr' | 'de'

interface SettingsState {
  historyEnabled: boolean
  maxHistoryEntries: MaxHistoryEntries
  locale: Locale
  baseUrl: string
}

interface SettingsContextValue extends SettingsState {
  toggleHistory: () => void
  setMaxHistoryEntries: (n: MaxHistoryEntries) => void
  setLocale: (l: Locale) => void
  setBaseUrl: (url: string) => void
}

// History is on by default — it's the app's most valuable persistence feature.
const DEFAULT: SettingsState = {
  historyEnabled: true,
  maxHistoryEntries: 10,
  locale: 'en',
  baseUrl: '',
}

function detectLocale(): Locale {
  try {
    const lang = navigator.language?.toLowerCase() ?? ''
    if (lang.startsWith('fr')) return 'fr'
    if (lang.startsWith('es')) return 'es'
    if (lang.startsWith('pt')) return 'pt'
    if (lang.startsWith('de')) return 'de'
  } catch {
    // navigator.language unavailable
  }
  return 'en'
}

function loadSettings(): SettingsState {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return { ...DEFAULT, locale: detectLocale() }
    const parsed = JSON.parse(raw) as Partial<SettingsState>
    const mx = parsed.maxHistoryEntries
    return {
      historyEnabled:
        typeof parsed.historyEnabled === 'boolean' ? parsed.historyEnabled : DEFAULT.historyEnabled,
      maxHistoryEntries:
        mx === 10 || mx === 25 || mx === 50 || mx === 100 ? mx : DEFAULT.maxHistoryEntries,
      locale:
        parsed.locale === 'en' ||
        parsed.locale === 'es' ||
        parsed.locale === 'pt' ||
        parsed.locale === 'fr' ||
        parsed.locale === 'de'
          ? parsed.locale
          : detectLocale(),
      baseUrl: typeof parsed.baseUrl === 'string' ? parsed.baseUrl : DEFAULT.baseUrl,
    }
  } catch {
    return { ...DEFAULT, locale: detectLocale() }
  }
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SettingsState>(loadSettings)

  // Persist whenever settings change
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(settings))
    } catch {
      // localStorage unavailable
    }
  }, [settings])

  // Keep <html lang="..."> in sync with the user's locale preference
  useEffect(() => {
    document.documentElement.lang = settings.locale
  }, [settings.locale])

  const toggleHistory = useCallback(() => {
    setSettings((prev) => ({ ...prev, historyEnabled: !prev.historyEnabled }))
  }, [])

  const setMaxHistoryEntries = useCallback((n: MaxHistoryEntries) => {
    setSettings((prev) => ({ ...prev, maxHistoryEntries: n }))
  }, [])

  const setLocale = useCallback((l: Locale) => {
    setSettings((prev) => ({ ...prev, locale: l }))
  }, [])

  const setBaseUrl = useCallback((url: string) => {
    setSettings((prev) => ({ ...prev, baseUrl: url }))
  }, [])

  return (
    <SettingsContext.Provider
      value={{ ...settings, toggleHistory, setMaxHistoryEntries, setLocale, setBaseUrl }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>')
  return ctx
}
