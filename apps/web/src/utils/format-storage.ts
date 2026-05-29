import type { OutputFormat } from '../types.js'

/** localStorage key for the persisted output-format preference. */
const LS_FORMAT_KEY = 'output-format'

/**
 * Reads the initial output format from:
 *   1. The `?fmt=` URL query param
 *   2. localStorage under 'output-format'
 *   3. Default: 'adf'
 *
 * The `search` parameter is injectable so the function is unit-testable
 * without mocking `window.location` — pass the desired query string directly.
 */
export function getStoredFormat(search = window.location.search): OutputFormat {
  const urlFmt = new URLSearchParams(search).get('fmt')
  if (urlFmt === 'wiki' || urlFmt === 'adf' || urlFmt === 'confluence') return urlFmt
  try {
    const stored = localStorage.getItem(LS_FORMAT_KEY)
    if (stored === 'wiki' || stored === 'adf' || stored === 'confluence') return stored
  } catch {
    // localStorage unavailable (sandboxed iframe, privacy mode)
  }
  return 'adf'
}
