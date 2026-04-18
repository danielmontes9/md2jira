// Prefer the modern User-Agent Client Hints API (Chromium 90+).
// Fall back to navigator.platform for Safari / Firefox / older browsers.
// navigator.userAgent is intentionally avoided — it is deprecated and easily spoofed.
const _platform: string =
  typeof navigator !== 'undefined'
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (((navigator as any).userAgentData?.platform as string | undefined) ?? navigator.platform)
    : ''

export const IS_MAC = /mac/i.test(_platform)
export const MOD_KEY = IS_MAC ? '⌘' : 'Ctrl'
