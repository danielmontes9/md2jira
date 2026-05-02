/**
 * Minimal translation utility — resolves a string key to its locale value.
 *
 * Currently hardcoded to English.  To add locale switching:
 *   1. Create a sibling locale file (e.g. `es.ts`) following the `en.ts` shape.
 *   2. Replace the `en` import below with a locale-selector that reads from
 *      `navigator.language`, a user setting, or a URL param.
 *   3. If you need React context or pluralisation, swap this file for
 *      react-i18next — the call-site API (`t('key')`) stays identical.
 */
import { en } from './en.js'
import { es } from './es.js'
import type { StringKey } from './en.js'
import { useSettings } from '../context/SettingsContext.js'

export type { StringKey }

/**
 * Returns the English UI string for `key`.
 * For locale-aware rendering inside React components, use `useT()` instead.
 *
 * @example
 *   import { t } from '../i18n/index.js'
 *   <p>{t('offlineBanner')}</p>
 */
export function t(key: StringKey): string {
  return en[key]
}

/**
 * Hook that returns a locale-aware `t` function.
 * Must be called inside a component that is a descendant of `<SettingsProvider>`.
 *
 * @example
 *   const t = useT()
 *   <p>{t('settingsTitle')}</p>
 */
export function useT(): (key: StringKey) => string {
  const { locale } = useSettings()
  const dict = locale === 'es' ? es : en
  return (key: StringKey) => dict[key]
}
