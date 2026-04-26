import { useMemo } from 'react'
import { EditorContent } from '@tiptap/react'
import type { Editor } from '@tiptap/react'
import { highlightJson } from '../../utils/highlight-json.js'
import { highlightWiki } from '../../utils/highlight-wiki.js'
import type { OutputFormat, ViewMode } from '../../types.js'

interface JiraOutputContentProps {
  format: OutputFormat
  viewMode: ViewMode
  value: string
  editor: Editor | null
  canEdit: boolean
  editMode: boolean
  isPending?: boolean | undefined
  /** Locally-edited Wiki Markup draft (only relevant in wiki edit mode). */
  wikiDraft?: string
  onWikiDraftChange?: (v: string) => void
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
  wikiDraft,
  onWikiDraftChange,
}: JiraOutputContentProps) {
  // Memoize expensive syntax-highlight passes: only recompute when `value` changes,
  // not on every render triggered by isPending / editMode / canEdit toggling.
  const highlightedJson = useMemo(() => highlightJson(value), [value])
  const highlightedWiki = useMemo(() => highlightWiki(value), [value])

  if (viewMode === 'code') {
    return (
      <pre
        role="region"
        aria-label={format === 'adf' ? 'ADF JSON code' : 'Wiki markup code'}
        className="flex-1 overflow-auto whitespace-pre-wrap p-4 font-mono text-sm text-neutral-900 dark:text-neutral-100"
        // highlightJson/highlightWiki escape HTML before injecting <span> tags — safe.
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: format === 'adf' ? highlightedJson : highlightedWiki }}
      />
    )
  }

  if (format === 'adf') {
    return (
      <EditorContent
        editor={editor}
        role="textbox"
        aria-label="Jira content editor"
        aria-multiline={true}
        aria-readonly={!(canEdit && editMode)}
        className={`jira-preview flex-1 overflow-auto p-6 text-sm text-neutral-900 outline-none transition-opacity duration-200 dark:text-neutral-100 ${isPending && !(canEdit && editMode) ? 'opacity-50' : ''} ${canEdit && editMode ? 'ring-1 ring-inset ring-blue-300 dark:ring-blue-700' : 'ring-0'}`}
      />
    )
  }

  // Wiki edit mode — plain textarea for direct editing
  if (format === 'wiki' && editMode) {
    return (
      <textarea
        value={wikiDraft ?? value}
        onChange={(e) => onWikiDraftChange?.(e.target.value)}
        aria-label="Wiki Markup editor"
        spellCheck={false}
        className="flex-1 resize-none p-4 font-mono text-sm leading-6 text-neutral-900 outline-none ring-1 ring-inset ring-blue-300 dark:text-neutral-100 dark:ring-blue-700"
      />
    )
  }

  return (
    <pre
      role="region"
      aria-label="Wiki markup preview"
      className="jira-preview flex-1 overflow-auto whitespace-pre-wrap p-6 font-mono text-sm text-neutral-900 dark:text-neutral-100"
      // highlightWiki escapes HTML entities before injecting <span> tags — safe.
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: highlightedWiki }}
    />
  )
}
