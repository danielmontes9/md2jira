import { useMemo, useRef, useEffect } from 'react'
import { EditorContent } from '@tiptap/react'
import type { Editor } from '@tiptap/react'
import { highlightJson } from '../../utils/highlight-json.js'
import { highlightWiki } from '../../utils/highlight-wiki.js'
import { highlightXml } from '../../utils/highlight-xml.js'
import type { OutputFormat, ViewMode } from '../../types.js'
import { useT } from '../../i18n/index.js'

interface JiraOutputContentProps {
  format: OutputFormat
  viewMode: ViewMode
  value: string
  editor: Editor | null
  canEdit: boolean
  editMode: boolean
  isPending?: boolean | undefined
  /** True while the ADF worker renders the first HTML for this session. */
  isLoadingPreview?: boolean
  /** Accessible label for the loading spinner text. */
  renderingPreviewLabel?: string
  /** Locally-edited Wiki Markup draft (only relevant in wiki edit mode). */
  wikiDraft?: string
  onWikiDraftChange?: (v: string) => void
  /** Locally-edited Confluence Storage Format draft (only relevant in confluence edit mode). */
  confluenceDraft?: string
  onConfluenceDraftChange?: (v: string) => void
}

/**
 * Renders the output content area for JiraOutput.
 * Handles three mutually exclusive views:
 *  - code view: syntax-highlighted JSON or raw wiki text
 *  - ADF preview: TipTap WYSIWYG editor
 *  - wiki preview: read-only plain-text pre
 *
 * Extracted from JiraOutput.tsx to keep the parent component as a pure
 * compositor and make each view branch independently testable.
 */
export function JiraOutputContent({
  format,
  viewMode,
  value,
  editor,
  canEdit,
  editMode,
  isPending,
  isLoadingPreview,
  renderingPreviewLabel,
  wikiDraft,
  onWikiDraftChange,
  confluenceDraft,
  onConfluenceDraftChange,
}: JiraOutputContentProps) {
  const t = useT()
  // ── All hooks must be declared unconditionally before any early return ─────
  // Memoize expensive syntax-highlight passes: only recompute when `value` changes.
  const highlightedJson = useMemo(() => highlightJson(value), [value])
  const highlightedWiki = useMemo(() => highlightWiki(value), [value])
  // Confluence output is XHTML — highlight tags, attributes, CDATA, and text.
  const highlightedConfluence = useMemo(() => highlightXml(value), [value])

  // Wiki textarea auto-resize: keep the ref + effect always at the top level
  // so hook order is stable across all render paths (code view, ADF, wiki preview, wiki edit).
  const wikiTextareaRef = useRef<HTMLTextAreaElement>(null)
  const wikiValue = wikiDraft ?? value
  useEffect(() => {
    const el = wikiTextareaRef.current
    if (!el) return
    /* v8 ignore next 2 -- scrollHeight is not available in jsdom */
    el.style.minHeight = 'auto'
    el.style.minHeight = `${el.scrollHeight}px`
  }, [wikiValue])
  // Confluence textarea auto-resize (same pattern as wiki)
  const confluenceTextareaRef = useRef<HTMLTextAreaElement>(null)
  const confluenceValue = confluenceDraft ?? value
  useEffect(() => {
    const el = confluenceTextareaRef.current
    if (!el) return
    /* v8 ignore next 2 -- scrollHeight is not available in jsdom */
    el.style.minHeight = 'auto'
    el.style.minHeight = `${el.scrollHeight}px`
  }, [confluenceValue])
  // ── End of hooks ────────────────────────────────────────────────────────────

  if (viewMode === 'code') {
    return (
      <pre
        role="region"
        aria-label={format === 'adf' ? t('adfCodeLabel') : t('wikiCodeLabel')}
        className="flex-1 overflow-auto whitespace-pre-wrap p-4 font-mono text-sm text-neutral-900 dark:text-neutral-100"
        // highlightJson/highlightWiki escape HTML before injecting <span> tags — safe.
        // highlightedConfluence is manually HTML-escaped — safe.
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html:
            format === 'adf'
              ? highlightedJson
              : format === 'confluence'
                ? highlightedConfluence
                : highlightedWiki,
        }}
      />
    )
  }

  if (format === 'adf') {
    // Show a centred spinner while the ADF worker renders the initial HTML.
    // Once previewHtml arrives, isLoadingPreview becomes false and TipTap
    // takes over with the rendered content.
    if (isLoadingPreview) {
      return (
        <div
          role="status"
          aria-label={t('renderingJiraPreview')}
          className="flex flex-1 flex-col items-center justify-center gap-3"
        >
          <svg
            className="h-8 w-8 animate-spin text-blue-500 dark:text-blue-400"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <p className="text-sm text-neutral-400 dark:text-neutral-500">
            {renderingPreviewLabel ?? t('renderingPreview')}
          </p>
        </div>
      )
    }

    return (
      <EditorContent
        editor={editor}
        role="textbox"
        aria-label={t('jiraContentEditor')}
        aria-multiline={true}
        aria-readonly={!(canEdit && editMode)}
        className={`jira-preview flex-1 overflow-auto p-6 text-sm text-neutral-900 outline-none transition-opacity duration-200 dark:text-neutral-100 ${isPending && !(canEdit && editMode) ? 'opacity-50' : ''}`}
      />
    )
  }

  // Confluence output — plain HTML-escaped XHTML, no wiki syntax decoration.
  if (format === 'confluence') {
    // Edit mode: editable textarea for fine-tuning the Confluence Storage Format XML.
    if (editMode) {
      return (
        <textarea
          ref={confluenceTextareaRef}
          value={confluenceValue}
          onChange={(e) => onConfluenceDraftChange?.(e.target.value)}
          aria-label={t('confluenceMarkupEditor')}
          spellCheck={false}
          className="flex-1 resize-none overflow-hidden p-4 font-mono text-sm leading-6 text-neutral-900 outline-none ring-1 ring-inset ring-blue-300 dark:text-neutral-100 dark:ring-blue-700"
        />
      )
    }
    return (
      <pre
        role="region"
        aria-label={t('formatConfluence')}
        className="flex-1 overflow-auto whitespace-pre-wrap p-6 font-mono text-sm text-neutral-900 dark:text-neutral-100"
        // highlightedConfluence is manually HTML-escaped — safe.
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: highlightedConfluence }}
      />
    )
  }

  // Wiki edit mode — plain textarea with auto-resize.
  if (format === 'wiki' && editMode) {
    return (
      <textarea
        ref={wikiTextareaRef}
        value={wikiValue}
        onChange={(e) => onWikiDraftChange?.(e.target.value)}
        aria-label={t('wikiMarkupEditor')}
        spellCheck={false}
        className="flex-1 resize-none overflow-hidden p-4 font-mono text-sm leading-6 text-neutral-900 outline-none ring-1 ring-inset ring-blue-300 dark:text-neutral-100 dark:ring-blue-700"
      />
    )
  }

  return (
    <pre
      role="region"
      aria-label={t('wikiMarkupPreview')}
      className="jira-preview flex-1 overflow-auto whitespace-pre-wrap p-6 font-mono text-sm text-neutral-900 dark:text-neutral-100"
      // highlightWiki escapes HTML entities before injecting <span> tags — safe.
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: highlightedWiki }}
    />
  )
}
