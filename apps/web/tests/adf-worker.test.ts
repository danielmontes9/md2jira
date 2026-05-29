/**
 * adf-worker message handler tests
 *
 * In jsdom, `self === window`. Importing the worker module sets
 * `window.onmessage` to the handler function, which we can then invoke
 * directly to test the request/response protocol without spinning up a
 * real Worker thread.
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import type { AdfDocument } from 'md2jira-core'

// ---------------------------------------------------------------------------
// Mock adfToHtml before the worker module is imported so the mock is in place
// when the module-level import runs.
// ---------------------------------------------------------------------------
const mockAdfToHtml = vi.fn<(doc: AdfDocument) => string>()

vi.mock('../src/components/jira-output/adf-renderer.js', () => ({
  adfToHtml: mockAdfToHtml,
}))

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------
const SIMPLE_ADF: AdfDocument = {
  version: 1,
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] }],
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('adf-worker message handler', () => {
  let workerOnMessage: (e: MessageEvent) => void

  beforeAll(async () => {
    mockAdfToHtml.mockReturnValue('<p>Hello</p>')
    // Importing sets self.onmessage (= window.onmessage in jsdom)
    await import('../src/workers/adf-worker.js')
    workerOnMessage = (self as unknown as { onmessage: (e: MessageEvent) => void }).onmessage
  })

  it('posts { id, html } when adfToHtml succeeds', () => {
    const postSpy = vi.spyOn(globalThis, 'postMessage').mockImplementation(() => {})

    workerOnMessage(new MessageEvent('message', { data: { id: 1, doc: SIMPLE_ADF } }))

    expect(postSpy).toHaveBeenCalledWith({ id: 1, html: '<p>Hello</p>' })
    postSpy.mockRestore()
  })

  it('forwards the request id in the response', () => {
    const postSpy = vi.spyOn(globalThis, 'postMessage').mockImplementation(() => {})

    workerOnMessage(new MessageEvent('message', { data: { id: 42, doc: SIMPLE_ADF } }))

    expect(postSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 42 }))
    postSpy.mockRestore()
  })

  it('posts { id, html: "", error: true } when adfToHtml throws', () => {
    mockAdfToHtml.mockImplementationOnce(() => {
      throw new Error('render failure')
    })
    const postSpy = vi.spyOn(globalThis, 'postMessage').mockImplementation(() => {})

    workerOnMessage(new MessageEvent('message', { data: { id: 99, doc: SIMPLE_ADF } }))

    expect(postSpy).toHaveBeenCalledWith({ id: 99, html: '', error: true })
    postSpy.mockRestore()
  })

  it('does not crash when adfToHtml throws — worker keeps running', () => {
    mockAdfToHtml.mockImplementationOnce(() => {
      throw new Error('another failure')
    })
    const postSpy = vi.spyOn(globalThis, 'postMessage').mockImplementation(() => {})

    // Should not throw
    expect(() =>
      workerOnMessage(new MessageEvent('message', { data: { id: 7, doc: SIMPLE_ADF } }))
    ).not.toThrow()

    postSpy.mockRestore()
  })
})
