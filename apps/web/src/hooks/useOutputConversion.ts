import { useMemo, useState, useEffect, useDeferredValue } from 'react'
import { convert, convertToAdf, convertToConfluence } from 'md2jira-core'
import type { AdfDocument } from 'md2jira-core'
import type { OutputFormat } from '../types.js'
import { useAdfHtmlWorker } from './useAdfHtmlWorker.js'

/** Characters above which the isPending spinner is shown during debounce. */
const LARGE_DOC_THRESHOLD = 10_000
/** Debounce delay in ms applied to documents above LARGE_DOC_THRESHOLD. */
const LARGE_DOC_DEBOUNCE_MS = 150

interface UseOutputConversionOptions {
  /** Current (live) markdown text — drives debounce and isPending detection. */
  markdown: string
  format: OutputFormat
  /** Optional base URL prepended to relative links during conversion. */
  baseUrl?: string
  /**
   * Called when the ADF worker stalls and falls back to synchronous rendering.
   * Typically used to show a warning toast.
   */
  onWorkerFallback: () => void
}

interface UseOutputConversionReturn {
  jiraOutput: string
  adfDoc: AdfDocument | null
  hasConversionError: boolean
  previewHtml: string
  workerError: boolean
  retryWorker: () => void
  /** True while markdown > threshold and the debounced value has not caught up yet. */
  isPending: boolean
  /** True while the ADF worker is computing the very first HTML for this session. */
  isLoadingPreview: boolean
}

/**
 * Encapsulates the full Markdown → Jira output conversion pipeline:
 *  1. Debounces large documents so convert() isn't called on every keystroke.
 *  2. Defers the expensive conversion via `useDeferredValue` for responsiveness.
 *  3. Converts the deferred markdown to the target format via `packages/core`.
 *  4. For ADF, renders the document to HTML off-thread via `useAdfHtmlWorker`.
 *  5. Derives UX state flags (`isPending`, `isLoadingPreview`).
 *
 * Extracted from AppContent so the conversion concern is independently testable.
 */
export function useOutputConversion({
  markdown,
  format,
  baseUrl,
  onWorkerFallback,
}: UseOutputConversionOptions): UseOutputConversionReturn {
  // Debounce large documents to avoid running convert() on every keystroke.
  // For small documents the state update is synchronous (no setTimeout).
  const [debouncedMarkdown, setDebouncedMarkdown] = useState(markdown)
  useEffect(() => {
    if (markdown.length <= LARGE_DOC_THRESHOLD) {
      setDebouncedMarkdown(markdown)
      return
    }
    const id = setTimeout(() => setDebouncedMarkdown(markdown), LARGE_DOC_DEBOUNCE_MS)
    return () => clearTimeout(id)
  }, [markdown])

  // useDeferredValue keeps the textarea fully responsive by deferring
  // the expensive convert() / convertToAdf() calls until the browser is idle.
  const deferredMarkdown = useDeferredValue(debouncedMarkdown)

  const { jiraOutput, adfDoc, hasConversionError } = useMemo<{
    jiraOutput: string
    adfDoc: AdfDocument | null
    hasConversionError: boolean
  }>(() => {
    const opts = baseUrl ? { baseUrl } : undefined
    try {
      if (format === 'adf') {
        const adf = convertToAdf(deferredMarkdown, opts)
        return {
          jiraOutput: JSON.stringify(adf, null, 2),
          adfDoc: adf,
          hasConversionError: false,
        }
      }
      if (format === 'confluence') {
        return {
          jiraOutput: convertToConfluence(deferredMarkdown, opts),
          adfDoc: null,
          hasConversionError: false,
        }
      }
      return {
        jiraOutput: convert(deferredMarkdown, opts),
        adfDoc: null,
        hasConversionError: false,
      }
    } catch {
      return { jiraOutput: '', adfDoc: null, hasConversionError: true }
    }
  }, [deferredMarkdown, format, baseUrl])

  const { html: previewHtml, workerError, retryWorker } = useAdfHtmlWorker(adfDoc, onWorkerFallback)

  // isPending: the large-doc debounce has introduced a visible lag — show a spinner.
  const isPending = markdown.length > LARGE_DOC_THRESHOLD && markdown !== debouncedMarkdown

  // isLoadingPreview: the ADF worker has a document but has not returned HTML yet.
  const isLoadingPreview = format === 'adf' && adfDoc !== null && previewHtml === '' && !workerError

  return {
    jiraOutput,
    adfDoc,
    hasConversionError,
    previewHtml,
    workerError,
    retryWorker,
    isPending,
    isLoadingPreview,
  }
}
