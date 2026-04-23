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
 *   - 
eedsUpdate: true when a new SW is waiting.
 *   - pplyUpdate: call this to tell the SW to take control immediately
 *     (posts SKIP_WAITING), then reloads the page.
 */
export function usePwaUpdate(): { needsUpdate: boolean; applyUpdate: () => void } {
  const [needsUpdate, setNeedsUpdate] = useState(false)
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const handleUpdate = (reg: ServiceWorkerRegistration) => {
      if (reg.waiting) {
        setWaitingWorker(reg.waiting)
        setNeedsUpdate(true)
      }
    }

    // Check immediately for an already-waiting SW (e.g. page was refreshed
    // after a new version was downloaded during a previous session).
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg) handleUpdate(reg)
    })

    // Listen for future update events on the current registration.
    const onControllerChange = () => {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg) handleUpdate(reg)
      })
    }
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)
    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
    }
  }, [])

  const applyUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' })
    }
    window.location.reload()
  }

  return { needsUpdate, applyUpdate }
}
