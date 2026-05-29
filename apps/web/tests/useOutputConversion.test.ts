import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useOutputConversion } from '../src/hooks/useOutputConversion.js'
import { useAdfHtmlWorker } from '../src/hooks/useAdfHtmlWorker.js'
import { convert, convertToAdf, convertToConfluence } from 'md2jira-core'

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('md2jira-core', () => ({
  convert: vi.fn(() => 'wiki output'),
  convertToAdf: vi.fn(() => ({ version: 1, type: 'doc', content: [] })),
  convertToConfluence: vi.fn(() => '<p>confluence</p>'),
}))

vi.mock('../src/hooks/useAdfHtmlWorker.js', () => ({
  useAdfHtmlWorker: vi.fn(),
}))

const MOCK_RETRY = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useAdfHtmlWorker).mockReturnValue({
    html: '<p>rendered</p>',
    workerError: false,
    retryWorker: MOCK_RETRY,
  })
})

function baseOpts(
  overrides: Partial<Parameters<typeof useOutputConversion>[0]> = {}
): Parameters<typeof useOutputConversion>[0] {
  return {
    markdown: '# Hello',
    format: 'wiki',
    onWorkerFallback: vi.fn(),
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// wiki format
// ---------------------------------------------------------------------------

describe('useOutputConversion — wiki format', () => {
  it('calls convert() and returns jiraOutput', () => {
    const { result } = renderHook(() => useOutputConversion(baseOpts({ format: 'wiki' })))
    expect(result.current.jiraOutput).toBe('wiki output')
    expect(result.current.hasConversionError).toBe(false)
    expect(result.current.adfDoc).toBeNull()
  })

  it('passes markdown to convert() for small documents', () => {
    renderHook(() => useOutputConversion(baseOpts({ format: 'wiki', markdown: 'short md' })))
    expect(vi.mocked(convert)).toHaveBeenCalledWith('short md')
  })

  it('isLoadingPreview is always false for wiki format', () => {
    vi.mocked(useAdfHtmlWorker).mockReturnValue({
      html: '',
      workerError: false,
      retryWorker: MOCK_RETRY,
    })
    const { result } = renderHook(() => useOutputConversion(baseOpts({ format: 'wiki' })))
    expect(result.current.isLoadingPreview).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// adf format
// ---------------------------------------------------------------------------

describe('useOutputConversion — adf format', () => {
  it('calls convertToAdf() and JSON-stringifies the result', () => {
    const { result } = renderHook(() => useOutputConversion(baseOpts({ format: 'adf' })))
    const parsed = JSON.parse(result.current.jiraOutput)
    expect(parsed).toMatchObject({ version: 1, type: 'doc' })
    expect(result.current.adfDoc).toMatchObject({ version: 1, type: 'doc' })
    expect(result.current.hasConversionError).toBe(false)
  })

  it('passes adfDoc to useAdfHtmlWorker and surfaces html + workerError + retryWorker', () => {
    vi.mocked(useAdfHtmlWorker).mockReturnValue({
      html: '<h1>Test</h1>',
      workerError: false,
      retryWorker: MOCK_RETRY,
    })
    const { result } = renderHook(() => useOutputConversion(baseOpts({ format: 'adf' })))
    expect(result.current.previewHtml).toBe('<h1>Test</h1>')
    expect(result.current.workerError).toBe(false)
    expect(result.current.retryWorker).toBe(MOCK_RETRY)
  })

  it('passes onWorkerFallback to useAdfHtmlWorker', () => {
    const onWorkerFallback = vi.fn()
    renderHook(() => useOutputConversion(baseOpts({ format: 'adf', onWorkerFallback })))
    expect(vi.mocked(useAdfHtmlWorker)).toHaveBeenCalledWith(expect.anything(), onWorkerFallback)
  })

  it('isLoadingPreview is true when adfDoc is non-null but html is empty', () => {
    vi.mocked(useAdfHtmlWorker).mockReturnValue({
      html: '',
      workerError: false,
      retryWorker: MOCK_RETRY,
    })
    const { result } = renderHook(() => useOutputConversion(baseOpts({ format: 'adf' })))
    expect(result.current.isLoadingPreview).toBe(true)
  })

  it('isLoadingPreview is false when html is non-empty', () => {
    vi.mocked(useAdfHtmlWorker).mockReturnValue({
      html: '<p>x</p>',
      workerError: false,
      retryWorker: MOCK_RETRY,
    })
    const { result } = renderHook(() => useOutputConversion(baseOpts({ format: 'adf' })))
    expect(result.current.isLoadingPreview).toBe(false)
  })

  it('isLoadingPreview is false when workerError is true', () => {
    vi.mocked(useAdfHtmlWorker).mockReturnValue({
      html: '',
      workerError: true,
      retryWorker: MOCK_RETRY,
    })
    const { result } = renderHook(() => useOutputConversion(baseOpts({ format: 'adf' })))
    expect(result.current.isLoadingPreview).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// confluence format
// ---------------------------------------------------------------------------

describe('useOutputConversion — confluence format', () => {
  it('calls convertToConfluence() and returns jiraOutput', () => {
    const { result } = renderHook(() => useOutputConversion(baseOpts({ format: 'confluence' })))
    expect(result.current.jiraOutput).toBe('<p>confluence</p>')
    expect(result.current.adfDoc).toBeNull()
    expect(result.current.hasConversionError).toBe(false)
    expect(vi.mocked(convertToConfluence)).toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// error handling
// ---------------------------------------------------------------------------

describe('useOutputConversion — error handling', () => {
  it('hasConversionError is true and jiraOutput is empty when convert() throws', () => {
    vi.mocked(convert).mockImplementationOnce(() => {
      throw new Error('conversion boom')
    })
    const { result } = renderHook(() => useOutputConversion(baseOpts({ format: 'wiki' })))
    expect(result.current.hasConversionError).toBe(true)
    expect(result.current.jiraOutput).toBe('')
    expect(result.current.adfDoc).toBeNull()
  })

  it('hasConversionError is true when convertToAdf() throws', () => {
    vi.mocked(convertToAdf).mockImplementationOnce(() => {
      throw new Error('adf boom')
    })
    const { result } = renderHook(() => useOutputConversion(baseOpts({ format: 'adf' })))
    expect(result.current.hasConversionError).toBe(true)
    expect(result.current.jiraOutput).toBe('')
  })
})

// ---------------------------------------------------------------------------
// isPending — debounce behaviour (requires fake timers)
// ---------------------------------------------------------------------------

describe('useOutputConversion — isPending', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('is false for small documents (≤ 10 000 chars)', () => {
    const { result } = renderHook(() => useOutputConversion(baseOpts({ markdown: '# Hello' })))
    expect(result.current.isPending).toBe(false)
  })

  it('is true immediately after switching to a large document (before debounce fires)', () => {
    const longMarkdown = 'x'.repeat(10_001)
    const { result, rerender } = renderHook(
      (props: Parameters<typeof useOutputConversion>[0]) => useOutputConversion(props),
      { initialProps: baseOpts({ markdown: '# Hello' }) }
    )

    act(() => {
      rerender(baseOpts({ markdown: longMarkdown }))
    })
    expect(result.current.isPending).toBe(true)
  })

  it('is false after the 150 ms debounce fires', () => {
    const longMarkdown = 'x'.repeat(10_001)
    const { result, rerender } = renderHook(
      (props: Parameters<typeof useOutputConversion>[0]) => useOutputConversion(props),
      { initialProps: baseOpts({ markdown: '# Hello' }) }
    )

    act(() => {
      rerender(baseOpts({ markdown: longMarkdown }))
    })
    expect(result.current.isPending).toBe(true)

    act(() => {
      vi.advanceTimersByTime(150)
    })
    expect(result.current.isPending).toBe(false)
  })
})
