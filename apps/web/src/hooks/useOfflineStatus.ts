import { useState, useEffect } from 'react'

/**
 * Returns true when the browser reports no network connectivity and false
 * when it recovers. Updates reactively via the native online/offline events.
 *
 * Note: navigator.onLine can return true even when there is no real
 * internet access (e.g. connected to a LAN with no upstream) - this is a
 * browser limitation. For PWA cache-notification purposes it is accurate enough.
 */
export function useOfflineStatus(): boolean {
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  )

  useEffect(() => {
    const goOffline = () => setIsOffline(true)
    const goOnline = () => setIsOffline(false)
    const ac = new AbortController()
    window.addEventListener('offline', goOffline, { signal: ac.signal })
    window.addEventListener('online', goOnline, { signal: ac.signal })
    return () => ac.abort()
  }, [])

  return isOffline
}
