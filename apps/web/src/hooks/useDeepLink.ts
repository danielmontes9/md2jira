import { useEffect, useMemo, useRef } from 'react'
import { encodeMarkdown, URL_MD_MAX_ENCODED } from '../utils/markdown-url.js'
import type { OutputFormat } from '../types.js'

/** Debounce applied to small documents (< LARGE_DOC_THRESHOLD chars). */
const DEBOUNCE_SMALL_MS = 300
/** Debounce applied to large documents — encoding is more expensive and the
 * user is less likely to share mid-typing, so we wait a bit longer. */
const DEBOUNCE_LARGE_MS = 800
/** Char count above which we switch to the longer debounce. */
const LARGE_DOC_THRESHOLD = 5_000

/**
 * Debounced URL deep-linking: updates the `?md=` and `?fmt=` query params after
 * the user stops typing/changing format. The debounce adapts to document size:
 *   - Small docs (< 5 000 chars): 300 ms — fast enough for live sharing.
 *   - Large docs (≥ 5 000 chars): 800 ms — encoding is more expensive;
 *     the user is unlikely to share mid-keystroke for large content.
 *
 * Uses `requestIdleCallback` (with `setTimeout` fallback) so the URL update
 * never interferes with rendering or typing responsiveness.
 *
 * Returns `isDeepLinkActive`: true when the current Markdown fits within the
 * URL limit and the ?md= param is being maintained. False when the document is
 * too large to deep-link (param is silently dropped).
 */
export function useDeepLink(markdown: string, format: OutputFormat): { isDeepLinkActive: boolean } {
  // Memoize the encoded value — encodeMarkdown (btoa + encodeURIComponent) is
  // moderately expensive and only needs to re-run when markdown actually changes,
  // not on every parent re-render (theme toggle, spinner state, etc.).
  const encodedRef = useRef('')
  const encoded = useMemo(() => (markdown ? encodeMarkdown(markdown) : ''), [markdown])
  encodedRef.current = encoded

  const isDeepLinkActive = useMemo(
    () => !markdown || encoded.length <= URL_MD_MAX_ENCODED,
    [markdown, encoded]
  )

  useEffect(() => {
    let idleCallbackId: number | undefined

    const debounceMs =
      markdown.length >= LARGE_DOC_THRESHOLD ? DEBOUNCE_LARGE_MS : DEBOUNCE_SMALL_MS

    const handle = setTimeout(() => {
      const updateUrl = () => {
        const url = new URL(window.location.href)
        if (!markdown) {
          url.searchParams.delete('md')
        } else {
          // Read the cached encoded value — no second btoa call.
          const enc = encodedRef.current
          if (enc.length <= URL_MD_MAX_ENCODED) {
            url.searchParams.set('md', enc)
          } else {
            url.searchParams.delete('md')
          }
        }
        // Persist non-default format so shared URLs open in the right mode.
        // 'adf' is the default — omit it to keep URLs clean.
        if (format === 'wiki' || format === 'confluence') {
          url.searchParams.set('fmt', format)
        } else {
          url.searchParams.delete('fmt')
        }
        // Skip replaceState when the URL hasn't changed — avoids unnecessary
        // browser history entries and listeners (e.g. browser extensions).
        const newUrl = url.toString()
        if (newUrl !== window.location.href) {
          window.history.replaceState(null, '', newUrl)
        }
      }
      if ('requestIdleCallback' in window) {
        idleCallbackId = window.requestIdleCallback(updateUrl)
      } else {
        updateUrl()
      }
    }, debounceMs)

    return () => {
      clearTimeout(handle)
      if (idleCallbackId !== undefined) window.cancelIdleCallback(idleCallbackId)
    }
  }, [markdown, format])

  return { isDeepLinkActive }
}
