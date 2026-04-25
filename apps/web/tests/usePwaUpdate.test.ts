import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePwaUpdate } from '../src/hooks/usePwaUpdate.js'

// Helper: build a minimal ServiceWorkerRegistration stub.
function makeReg({
  waiting = null,
  installing = null,
}: {
  waiting?: ServiceWorker | null
  installing?: ServiceWorker | null
} = {}): ServiceWorkerRegistration {
  const listeners: Record<string, EventListener[]> = {}
  return {
    waiting,
    installing,
    addEventListener: vi.fn((type: string, cb: EventListener) => {
      ;(listeners[type] ??= []).push(cb)
    }),
    dispatchEvent: vi.fn((event: Event) => {
      ;(listeners[event.type] ?? []).forEach((cb) => cb(event))
      return true
    }),
    removeEventListener: vi.fn(),
  } as unknown as ServiceWorkerRegistration
}

// Helper: minimal ServiceWorker stub.
function makeSW(state: ServiceWorkerState = 'installing'): ServiceWorker {
  const listeners: Record<string, EventListener[]> = {}
  return {
    state,
    postMessage: vi.fn(),
    addEventListener: vi.fn((type: string, cb: EventListener) => {
      ;(listeners[type] ??= []).push(cb)
    }),
    dispatchEvent: vi.fn((event: Event) => {
      ;(listeners[event.type] ?? []).forEach((cb) => cb(event))
      return true
    }),
    removeEventListener: vi.fn(),
  } as unknown as ServiceWorker
}

function stubServiceWorker({
  supported = true,
  reg,
  controller,
}: {
  supported?: boolean
  reg?: ServiceWorkerRegistration
  controller?: ServiceWorker | null
} = {}) {
  if (!supported) {
    vi.stubGlobal('navigator', { ...navigator, serviceWorker: undefined })
    return
  }
  const swContainer = {
    controller: controller ?? makeSW('activated'),
    getRegistration: vi.fn().mockResolvedValue(reg),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }
  vi.stubGlobal('navigator', { ...navigator, serviceWorker: swContainer })
}

beforeEach(() => {
  vi.stubGlobal('location', { ...window.location, reload: vi.fn() })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('usePwaUpdate', () => {
  it('returns needsUpdate=false on initial render when no SW is registered', async () => {
    stubServiceWorker({})
    const { result } = renderHook(() => usePwaUpdate())
    // Let the getRegistration promise resolve
    await act(async () => {})
    expect(result.current.needsUpdate).toBe(false)
  })

  it('does not throw when serviceWorker is not supported', async () => {
    stubServiceWorker({ supported: false })
    expect(() => renderHook(() => usePwaUpdate())).not.toThrow()
  })

  it('sets needsUpdate=true when a SW is already waiting', async () => {
    const waitingSW = makeSW('installed')
    const reg = makeReg({ waiting: waitingSW })
    stubServiceWorker({ reg })

    const { result } = renderHook(() => usePwaUpdate())
    await act(async () => {})

    expect(result.current.needsUpdate).toBe(true)
  })

  it('sets needsUpdate=true after updatefound + statechange to installed', async () => {
    const installingSW = makeSW('installing')
    const reg = makeReg({ waiting: null, installing: null })
    stubServiceWorker({ reg })

    const { result } = renderHook(() => usePwaUpdate())
    await act(async () => {})

    expect(result.current.needsUpdate).toBe(false)

    // Simulate 'updatefound': reg.installing is now set
    ;(reg as unknown as { installing: ServiceWorker }).installing = installingSW
    act(() => {
      reg.dispatchEvent(new Event('updatefound'))
    })

    // Simulate the installing SW transitioning to 'installed'
    ;(installingSW as unknown as { state: ServiceWorkerState }).state = 'installed'
    act(() => {
      installingSW.dispatchEvent(new Event('statechange'))
    })

    expect(result.current.needsUpdate).toBe(true)
  })

  it('applyUpdate posts SKIP_WAITING and reloads', async () => {
    const waitingSW = makeSW('installed')
    const reg = makeReg({ waiting: waitingSW })
    stubServiceWorker({ reg })

    const { result } = renderHook(() => usePwaUpdate())
    await act(async () => {})

    expect(result.current.needsUpdate).toBe(true)

    act(() => {
      result.current.applyUpdate()
    })

    expect(waitingSW.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' })
    expect(window.location.reload).toHaveBeenCalled()
  })

  it('applyUpdate still reloads even if no waiting worker is tracked', () => {
    stubServiceWorker({})
    const { result } = renderHook(() => usePwaUpdate())

    act(() => {
      result.current.applyUpdate()
    })

    expect(window.location.reload).toHaveBeenCalled()
  })
})
