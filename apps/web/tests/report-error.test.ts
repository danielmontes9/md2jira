import { describe, it, expect, vi, afterEach } from 'vitest'
import { reportError } from '../src/utils/report-error.js'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  // Clean up any XSS sentinel that tests might have set
  delete (window as unknown as Record<string, unknown>).__xss
})

describe('reportError', () => {
  it('does not throw when called with a plain Error', () => {
    expect(() => reportError(new Error('boom'))).not.toThrow()
  })

  it('does not throw when called with an Error and componentStack', () => {
    expect(() => reportError(new Error('oops'), '  at MyComponent')).not.toThrow()
  })

  it('calls navigator.sendBeacon when VITE_ERROR_URL is set', () => {
    const beacon = vi.fn().mockReturnValue(true)
    vi.stubGlobal('navigator', { ...navigator, sendBeacon: beacon })

    // Patch import.meta.env by spying on the module-level read.
    // Vitest replaces import.meta.env at build time — simulate a set URL by
    // temporarily making the module see it via vi.stubEnv (Vitest 1.3+).
    vi.stubEnv('VITE_ERROR_URL', 'https://example.com/errors')

    reportError(new Error('reported'), '  at Comp')

    expect(beacon).toHaveBeenCalledOnce()
    const [url, blob] = beacon.mock.calls[0] as [string, Blob]
    expect(url).toBe('https://example.com/errors')
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('application/json')
  })

  it('does not call navigator.sendBeacon when VITE_ERROR_URL is absent', () => {
    const beacon = vi.fn()
    vi.stubGlobal('navigator', { ...navigator, sendBeacon: beacon })
    vi.stubEnv('VITE_ERROR_URL', '')

    reportError(new Error('silent'))

    expect(beacon).not.toHaveBeenCalled()
  })

  it('sends a JSON blob containing error name and message', () => {
    const payloads: unknown[] = []
    const beacon = vi.fn().mockImplementation((_url: string, body: BodyInit) => {
      // Capture the serialised JSON before it's wrapped in a Blob
      if (typeof body === 'string') {
        payloads.push(JSON.parse(body))
      }
      return true
    })
    vi.stubGlobal('navigator', { ...navigator, sendBeacon: beacon })

    // Intercept JSON.stringify to capture the payload object before it becomes a Blob.
    const originalStringify = JSON.stringify
    const stringifySpy = vi
      .spyOn(JSON, 'stringify')
      .mockImplementation((...args: Parameters<typeof JSON.stringify>) => {
        const result = originalStringify(...args)
        const parsed = JSON.parse(result) as Record<string, unknown>
        if (parsed && typeof parsed === 'object' && 'name' in parsed && 'message' in parsed) {
          payloads.push(parsed)
        }
        return result
      })

    vi.stubEnv('VITE_ERROR_URL', 'https://example.com/errors')

    const err = new Error('something went wrong')
    err.name = 'RenderError'
    reportError(err, '  at Panel')

    stringifySpy.mockRestore()

    expect(payloads.length).toBeGreaterThan(0)
    const payload = payloads[0] as Record<string, unknown>
    expect(payload['name']).toBe('RenderError')
    expect(payload['message']).toBe('something went wrong')
    expect(payload['componentStack']).toBe('  at Panel')
    expect(typeof payload['timestamp']).toBe('number')
  })

  it('does not throw when sendBeacon itself throws', () => {
    vi.stubGlobal('navigator', {
      ...navigator,
      sendBeacon: vi.fn().mockImplementation(() => {
        throw new Error('beacon unavailable')
      }),
    })
    vi.stubEnv('VITE_ERROR_URL', 'https://example.com/errors')

    // Must swallow the internal error — reporting must never break the app.
    expect(() => reportError(new Error('crash'))).not.toThrow()
  })

  it('redacts the ?md= param from the reported URL', () => {
    const payloads: unknown[] = []
    const beacon = vi.fn()
    vi.stubGlobal('navigator', { ...navigator, sendBeacon: beacon })

    // Override window.location so it carries a ?md= param.
    vi.stubGlobal('location', {
      href: 'https://example.com/?md=SGVsbG8gV29ybGQ&fmt=wiki',
      origin: 'https://example.com',
    })

    const originalStringify = JSON.stringify
    const stringifySpy = vi
      .spyOn(JSON, 'stringify')
      .mockImplementation((...args: Parameters<typeof JSON.stringify>) => {
        const result = originalStringify(...args)
        const parsed = JSON.parse(result) as Record<string, unknown>
        if (parsed && typeof parsed === 'object' && 'name' in parsed) {
          payloads.push(parsed)
        }
        return result
      })

    vi.stubEnv('VITE_ERROR_URL', 'https://example.com/errors')
    reportError(new Error('redact test'))
    stringifySpy.mockRestore()

    expect(payloads.length).toBeGreaterThan(0)
    const payload = payloads[0] as Record<string, unknown>
    // ?md= must be absent; ?fmt= must be preserved.
    expect(String(payload['url'])).not.toContain('md=')
    expect(String(payload['url'])).toContain('fmt=wiki')
  })
})
