import { useState, useEffect } from 'react'

/**
 * Returns 	rue when the browser reports no network connectivity and alse
 * when it recovers. Updates reactively via the native online/offline events.
 *
 * Note: 
avigator.onLine can return 	rue even when there is no real
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

    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)

    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  return isOffline
}
