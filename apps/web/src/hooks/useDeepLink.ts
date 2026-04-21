import { useEffect, useMemo } from 'react'
import { encodeMarkdown, URL_MD_MAX_ENCODED } from '../utils/markdown-url.js'
import type { OutputFormat } from '../types.js'

/**
 * Debounced URL deep-linking: updates the `?md=` and `?fmt=` query params 500 ms
 * after the user stops typing/changing format. Uses `requestIdleCallback` (with
 * `setTimeout` fallback) so the URL update never interferes with rendering or
 * typing responsiveness.
 *
 * Returns `isDeepLinkActive`: true when the current Markdown fits within the
 * URL limit and the ?md= param is being maintained. False when the document is
 * too large to deep-link (param is silently dropped).
 */
export function useDeepLink(markdown: string, format: OutputFormat): { isDeepLinkActive: boolean } {
  // Memoized so encodeMarkdown (btoa) only runs when markdown changes, not on every render.
  const isDeepLinkActive = useMemo(
    () => !markdown || encodeMarkdown(markdown).length <= URL_MD_MAX_ENCODED,
    [markdown]
  )

  useEffect(() => {
    let idleCallbackId: number | undefined

    const handle = setTimeout(() => {
      const updateUrl = () => {
        const url = new URL(window.location.href)
        if (!markdown) {
          url.searchParams.delete('md')
        } else {
          const encoded = encodeMarkdown(markdown)
          if (encoded.length <= URL_MD_MAX_ENCODED) {
            url.searchParams.set('md', encoded)
          } else {
            url.searchParams.delete('md')
          }
        }
        // Persist non-default format so shared URLs open in the right mode.
        if (format === 'wiki') {
          url.searchParams.set('fmt', 'wiki')
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
    }, 500)

    return () => {
      clearTimeout(handle)
      if (idleCallbackId !== undefined) window.cancelIdleCallback(idleCallbackId)
    }
  }, [markdown, format])

  return { isDeepLinkActive }
}
