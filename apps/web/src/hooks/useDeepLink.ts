import { useEffect } from 'react'
import { encodeMarkdown, URL_MD_MAX_ENCODED } from '../utils/markdown-url.js'

/**
 * Debounced URL deep-linking: updates the `?md=` query param 500 ms after the
 * user stops typing. Uses `requestIdleCallback` (with `setTimeout` fallback) so
 * the URL update never interferes with rendering or typing responsiveness.
 */
export function useDeepLink(markdown: string): void {
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
        window.history.replaceState(null, '', url.toString())
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
  }, [markdown])
}
