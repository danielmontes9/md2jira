import { useState, useEffect } from 'react'

/**
 * Detects when a new service worker version is waiting to activate.
 *
 * VitePWA registers a service worker automatically. When a new build is
 * deployed, the browser downloads the updated SW in the background. The SW
 * stays in the 'waiting' state until all tabs are closed (or the user takes
 * action). This hook surfaces that event so the UI can prompt the user.
 *
 * Returns:
 *   - needsUpdate: true when a new SW is waiting.
 *   - applyUpdate: call this to tell the SW to take control immediately
 *     (posts SKIP_WAITING), then reloads the page.
 */
export function usePwaUpdate(): { needsUpdate: boolean; applyUpdate: () => void } {
  const [needsUpdate, setNeedsUpdate] = useState(false)
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg) return

      // Case 1: a SW is already waiting from a previous background update.
      if (reg.waiting && navigator.serviceWorker.controller) {
        setWaitingWorker(reg.waiting)
        setNeedsUpdate(true)
        return
      }

      // Case 2: a new SW starts downloading while this tab is open.
      // 'updatefound' fires when reg.installing is set; we then watch for
      // 'statechange' until the installing SW reaches 'installed' (waiting).
      reg.addEventListener('updatefound', () => {
        const installing = reg.installing
        if (!installing) return
        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            setWaitingWorker(installing)
            setNeedsUpdate(true)
          }
        })
      })
    })
  }, [])

  const applyUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' })
    }
    window.location.reload()
  }

  return { needsUpdate, applyUpdate }
}
