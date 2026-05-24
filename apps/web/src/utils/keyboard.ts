// Prefer the modern User-Agent Client Hints API (Chromium 90+).
// Fall back to navigator.platform for Safari / Firefox / older browsers.
// navigator.userAgent is intentionally avoided — it is deprecated and easily spoofed.

/** Minimal typing for the User-Agent Client Hints API (not yet in lib.dom.d.ts). */
interface NavigatorUA {
  userAgentData?: { readonly platform: string }
}

/* v8 ignore start -- platform detection: branches depend on OS/browser, not testable in jsdom */
const _platform: string =
  typeof navigator !== 'undefined'
    ? ((navigator as NavigatorUA).userAgentData?.platform ?? navigator.platform)
    : ''
/* v8 ignore stop */

export const IS_MAC = /mac/i.test(_platform)
/* v8 ignore next -- '⌘' branch only reachable on macOS hosts */
export const MOD_KEY = IS_MAC ? '⌘' : 'Ctrl'
