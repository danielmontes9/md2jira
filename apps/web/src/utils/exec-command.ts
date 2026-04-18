/**
 * Typed wrappers around the deprecated `document.execCommand()`.
 *
 * Using execCommand is the only cross-browser way to format / insert text in a
 * textarea or contentEditable element while preserving the native undo stack.
 * Casting through `unknown` avoids TypeScript's @deprecated diagnostic
 * without resorting to `any`.
 *
 * @see https://w3c.github.io/input-events/ — future InputEvent-based alternative
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * MIGRATION PLAN — execCommand → TipTap (ProseMirror)
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Status:  BLOCKED — execCommand has no browser removal timeline as of 2026-Q2.
 * Effort:  ~40-60 hours (rewrite WYSIWYG + all toolbar commands + Turndown
 *          HTML→Markdown roundtrip → ProseMirror state serialization).
 *
 * Migration steps:
 *   1. Install `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-*`.
 *   2. Replace the contentEditable div + `useEditorSelection` + `execCommand()`
 *      with a TipTap `<EditorContent>` component.
 *   3. Replace each toolbar command (bold, italic, insertHtml, etc.) with
 *      TipTap chain commands (`editor.chain().focus().toggleBold().run()`).
 *   4. Replace TurndownService HTML→Markdown roundtrip with ProseMirror
 *      JSON → `@tiptap/pm/model` serialization → custom Markdown serializer.
 *   5. Delete `useMarkdownSync.ts`, `turndown-config.ts`, `exec-command.ts`.
 *   6. Set `VITE_ENABLE_WYSIWYG=false` in CI/preview until migration is stable.
 *
 * Affected files:
 *   - apps/web/src/utils/exec-command.ts        (THIS FILE — delete)
 *   - apps/web/src/hooks/useWysiwygEditor.ts     (rewrite)
 *   - apps/web/src/hooks/useEditorSelection.ts   (delete)
 *   - apps/web/src/hooks/useMarkdownSync.ts      (delete)
 *   - apps/web/src/hooks/useMarkdownShortcuts.ts (update insertText calls)
 *   - apps/web/src/components/jira-output/EditorToolbar.tsx (rewrite commands)
 *   - apps/web/src/components/jira-output/turndown-config.ts (delete)
 *
 * Tracking: https://github.com/danielmontes9/md2jira/issues — create issue
 *           with label `tech-debt` and milestone `v1.0`.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

type ExecDoc = { execCommand(cmd: string, showUI: boolean, value: string): boolean }

/** Insert plain text at the current cursor position, preserving undo history. */
export function execInsertText(text: string): boolean {
  return (document as unknown as ExecDoc).execCommand('insertText', false, text)
}

/** Execute a rich-text formatting command (bold, italic, insertHTML, etc.), preserving undo history. */
export function execCommand(cmd: string, arg = ''): boolean {
  return (document as unknown as ExecDoc).execCommand(cmd, false, arg)
}
