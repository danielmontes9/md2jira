import { useCallback, useRef } from 'react'
import type { KeyboardEvent } from 'react'

/**
 * Returns a keydown handler for the Markdown textarea that implements
 * formatting shortcuts, auto-list continuation, and line manipulation.
 *
 * Calls onChange(newValue) directly (the React-idiomatic way for controlled
 * inputs) and restores cursor position via requestAnimationFrame after React
 * re-renders the controlled textarea.
 */

// ── Helpers ──

/**
 * Apply a text mutation to a controlled textarea:
 * 1. Call onChange(newValue) so React state is updated.
 * 2. Restore the cursor position in the next animation frame (after re-render).
 */
function applyChange(
  ta: HTMLTextAreaElement,
  newValue: string,
  newPos: number,
  onChange: (v: string) => void
): void {
  onChange(newValue)
  requestAnimationFrame(() => {
    ta.setSelectionRange(newPos, newPos)
  })
}

/** Insert text at the current selection, replacing any selected text. */
function insertText(ta: HTMLTextAreaElement, text: string, onChange: (v: string) => void): void {
  const { selectionStart, selectionEnd, value } = ta
  const newValue = value.slice(0, selectionStart) + text + value.slice(selectionEnd)
  applyChange(ta, newValue, selectionStart + text.length, onChange)
}

interface LineInfo {
  lineStart: number
  lineEnd: number
  text: string
}

function getLine(val: string, pos: number): LineInfo {
  const lineStart = val.lastIndexOf('\n', pos - 1) + 1
  const lineEndRaw = val.indexOf('\n', pos)
  const lineEnd = lineEndRaw === -1 ? val.length : lineEndRaw
  return { lineStart, lineEnd, text: val.substring(lineStart, lineEnd) }
}

function replaceLine(
  ta: HTMLTextAreaElement,
  lineStart: number,
  lineEnd: number,
  newText: string,
  onChange: (v: string) => void
): void {
  const newValue = ta.value.slice(0, lineStart) + newText + ta.value.slice(lineEnd)
  applyChange(ta, newValue, lineStart + newText.length, onChange)
}

function wrapSelection(
  e: KeyboardEvent<HTMLTextAreaElement>,
  wrapper: string,
  onChange: (v: string) => void
): void {
  e.preventDefault()
  const ta = e.currentTarget
  const { selectionStart, selectionEnd, value } = ta
  const selected = value.substring(selectionStart, selectionEnd)
  const ins = `${wrapper}${selected}${wrapper}`
  const newValue = value.slice(0, selectionStart) + ins + value.slice(selectionEnd)
  applyChange(ta, newValue, selectionStart + ins.length, onChange)
}

const ctrlOrMeta = (e: KeyboardEvent<HTMLTextAreaElement>) => e.ctrlKey || e.metaKey

// ── Shortcut table ──

interface ShortcutEntry {
  match: (e: KeyboardEvent<HTMLTextAreaElement>) => boolean
  handle: (
    e: KeyboardEvent<HTMLTextAreaElement>,
    ta: HTMLTextAreaElement,
    onChange: (v: string) => void
  ) => void
}

const SHORTCUT_TABLE: ShortcutEntry[] = [
  // Shift+Tab → dedent: remove up to 2 leading spaces from the current line.
  // Must be listed before the plain-Tab entry so it matches first in the loop.
  {
    match: (e) => e.key === 'Tab' && e.shiftKey && !ctrlOrMeta(e) && !e.altKey,
    handle: (e, ta, onChange) => {
      e.preventDefault()
      const { lineStart, lineEnd, text } = getLine(ta.value, ta.selectionStart)
      const dedented = text.replace(/^ {1,2}/, '')
      if (dedented === text) return // nothing to remove
      const removed = text.length - dedented.length
      const newValue = ta.value.slice(0, lineStart) + dedented + ta.value.slice(lineEnd)
      // Keep cursor at the same column offset, clamped to the line start.
      const newPos = Math.max(lineStart, ta.selectionStart - removed)
      applyChange(ta, newValue, newPos, onChange)
    },
  },
  // Tab → 2 spaces
  {
    match: (e) => e.key === 'Tab' && !ctrlOrMeta(e) && !e.altKey,
    handle: (e, ta, onChange) => {
      e.preventDefault()
      insertText(ta, '  ', onChange)
    },
  },
  // Ctrl+B → bold
  {
    match: (e) => e.key === 'b' && ctrlOrMeta(e) && !e.shiftKey && !e.altKey,
    handle: (e, _ta, onChange) => wrapSelection(e, '**', onChange),
  },
  // Ctrl+I → italic
  {
    match: (e) => e.key === 'i' && ctrlOrMeta(e) && !e.shiftKey && !e.altKey,
    handle: (e, _ta, onChange) => wrapSelection(e, '_', onChange),
  },
  // Ctrl+K → link — wraps selection as [text]() with cursor inside the parens
  {
    match: (e) => e.key === 'k' && ctrlOrMeta(e) && !e.shiftKey && !e.altKey,
    handle: (e, ta, onChange) => {
      e.preventDefault()
      const { selectionStart, selectionEnd, value } = ta
      const selected = value.substring(selectionStart, selectionEnd)
      const ins = `[${selected}]()`
      const newValue = value.slice(0, selectionStart) + ins + value.slice(selectionEnd)
      // Cursor goes inside the parens: skip '[' + selected + '](' = selected.length + 3 chars
      const urlPos = selectionStart + selected.length + 3
      onChange(newValue)
      requestAnimationFrame(() => ta.setSelectionRange(urlPos, urlPos))
    },
  },
  // Ctrl+Shift+K → inline code
  {
    match: (e) => e.key === 'k' && ctrlOrMeta(e) && e.shiftKey && !e.altKey,
    handle: (e, _ta, onChange) => wrapSelection(e, '`', onChange),
  },
  // Ctrl+Shift+X → strikethrough
  {
    match: (e) => e.key === 'x' && ctrlOrMeta(e) && e.shiftKey && !e.altKey,
    handle: (e, _ta, onChange) => wrapSelection(e, '~~', onChange),
  },
  // Ctrl+Shift+H → cycle heading h1 → h2 → h3 → none
  {
    match: (e) => e.key === 'h' && ctrlOrMeta(e) && e.shiftKey && !e.altKey,
    handle: (e, ta, onChange) => {
      e.preventDefault()
      const { lineStart, lineEnd, text } = getLine(ta.value, ta.selectionStart)
      const match = text.match(/^(#{1,6}) /)
      let newLine: string
      if (!match || !match[0] || !match[1]) {
        newLine = `# ${text}`
      } else if (match[1].length >= 3) {
        newLine = text.replace(/^#{1,6} /, '')
      } else {
        newLine = `${'#'.repeat(match[1].length + 1)} ${text.substring(match[0].length)}`
      }
      replaceLine(ta, lineStart, lineEnd, newLine, onChange)
    },
  },
  // Ctrl+Shift+L → toggle bullet list
  {
    match: (e) => e.key === 'l' && ctrlOrMeta(e) && e.shiftKey && !e.altKey,
    handle: (e, ta, onChange) => {
      e.preventDefault()
      const { lineStart, lineEnd, text } = getLine(ta.value, ta.selectionStart)
      replaceLine(
        ta,
        lineStart,
        lineEnd,
        text.startsWith('- ') ? text.substring(2) : `- ${text}`,
        onChange
      )
    },
  },
  // Ctrl+Shift+O → toggle numbered list
  {
    match: (e) => e.key === 'o' && ctrlOrMeta(e) && e.shiftKey && !e.altKey,
    handle: (e, ta, onChange) => {
      e.preventDefault()
      const { lineStart, lineEnd, text } = getLine(ta.value, ta.selectionStart)
      replaceLine(
        ta,
        lineStart,
        lineEnd,
        /^\d+\. /.test(text) ? text.replace(/^\d+\. /, '') : `1. ${text}`,
        onChange
      )
    },
  },
  // Ctrl+Shift+Q → toggle blockquote
  {
    match: (e) => e.key === 'q' && ctrlOrMeta(e) && e.shiftKey && !e.altKey,
    handle: (e, ta, onChange) => {
      e.preventDefault()
      const { lineStart, lineEnd, text } = getLine(ta.value, ta.selectionStart)
      replaceLine(
        ta,
        lineStart,
        lineEnd,
        text.startsWith('> ') ? text.substring(2) : `> ${text}`,
        onChange
      )
    },
  },
  // Ctrl+Shift+C → insert fenced code block, cursor on the blank middle line
  {
    match: (e) => e.key === 'c' && ctrlOrMeta(e) && e.shiftKey && !e.altKey,
    handle: (e, ta, onChange) => {
      e.preventDefault()
      const { selectionStart: ss, selectionEnd: se, value } = ta
      const ins = '```\n\n```'
      const newValue = value.slice(0, ss) + ins + value.slice(se)
      // "```\n" is 4 chars → blank line is at ss + 4
      onChange(newValue)
      requestAnimationFrame(() => ta.setSelectionRange(ss + 4, ss + 4))
    },
  },
  // Ctrl+Enter → insert blank line below current line
  {
    match: (e) => e.key === 'Enter' && ctrlOrMeta(e) && !e.shiftKey && !e.altKey,
    handle: (e, ta, onChange) => {
      e.preventDefault()
      const { lineEnd } = getLine(ta.value, ta.selectionStart)
      const newValue = ta.value.slice(0, lineEnd) + '\n' + ta.value.slice(lineEnd)
      applyChange(ta, newValue, lineEnd + 1, onChange)
    },
  },
  // Alt+↑ → move line up
  {
    match: (e) => e.key === 'ArrowUp' && e.altKey && !ctrlOrMeta(e),
    handle: (e, ta, onChange) => {
      e.preventDefault()
      const { lineStart, lineEnd, text: currentLine } = getLine(ta.value, ta.selectionStart)
      if (lineStart === 0) return
      const { lineStart: prevStart, text: prevLine } = getLine(ta.value, lineStart - 1)
      const cursorOffset = ta.selectionStart - lineStart
      const newValue =
        ta.value.slice(0, prevStart) + `${currentLine}\n${prevLine}` + ta.value.slice(lineEnd)
      const newPos = prevStart + cursorOffset
      onChange(newValue)
      requestAnimationFrame(() => ta.setSelectionRange(newPos, newPos))
    },
  },
  // Alt+↓ → move line down
  {
    match: (e) => e.key === 'ArrowDown' && e.altKey && !ctrlOrMeta(e),
    handle: (e, ta, onChange) => {
      e.preventDefault()
      const val = ta.value
      const { lineStart, lineEnd, text: currentLine } = getLine(val, ta.selectionStart)
      if (lineEnd === val.length) return
      const nextStart = lineEnd + 1
      const nextEndRaw = val.indexOf('\n', nextStart)
      const nextEnd = nextEndRaw === -1 ? val.length : nextEndRaw
      const nextLine = val.substring(nextStart, nextEnd)
      const cursorOffset = ta.selectionStart - lineStart
      const newValue = val.slice(0, lineStart) + `${nextLine}\n${currentLine}` + val.slice(nextEnd)
      const newPos = lineStart + nextLine.length + 1 + cursorOffset
      onChange(newValue)
      requestAnimationFrame(() => ta.setSelectionRange(newPos, newPos))
    },
  },
  // Ctrl+D → duplicate line
  {
    match: (e) => e.key === 'd' && ctrlOrMeta(e) && !e.shiftKey && !e.altKey,
    handle: (e, ta, onChange) => {
      e.preventDefault()
      const { lineEnd, text } = getLine(ta.value, ta.selectionStart)
      const ins = `\n${text}`
      const newValue = ta.value.slice(0, lineEnd) + ins + ta.value.slice(lineEnd)
      applyChange(ta, newValue, lineEnd + ins.length, onChange)
    },
  },
]

// ── Enter → auto-continue list item (context-dependent, handled separately) ──

function handleEnterAutoContinue(
  e: KeyboardEvent<HTMLTextAreaElement>,
  ta: HTMLTextAreaElement,
  onChange: (v: string) => void
): boolean {
  if (e.key !== 'Enter' || ctrlOrMeta(e) || e.shiftKey || e.altKey) return false
  const { selectionStart, selectionEnd } = ta
  if (selectionStart !== selectionEnd) return false

  const { lineStart, lineEnd, text } = getLine(ta.value, selectionStart)
  if (selectionStart !== lineEnd) return false

  const emptyBullet = text.match(/^(\s*)([-*]) $/)
  const emptyNumbered = text.match(/^(\s*)(\d+)\. $/)
  // Task list patterns — must be checked BEFORE bulletMatch since `- [ ] text`
  // also matches the generic bullet regex.
  const emptyTask = text.match(/^(\s*)([-*]) \[[ x]\]\s*$/)
  const taskMatch = text.match(/^(\s*)([-*]) \[[ x]\] (.+)$/)
  const bulletMatch = text.match(/^(\s*)([-*]) (.+)$/)
  const numberedMatch = text.match(/^(\s*)(\d+)\. (.+)$/)

  if (emptyTask || emptyBullet || emptyNumbered) {
    e.preventDefault()
    replaceLine(ta, lineStart, lineEnd, '', onChange)
    return true
  }
  if (taskMatch) {
    e.preventDefault()
    insertText(ta, `\n${taskMatch[1]}${taskMatch[2]} [ ] `, onChange)
    return true
  }
  if (bulletMatch) {
    e.preventDefault()
    insertText(ta, `\n${bulletMatch[1]}${bulletMatch[2]} `, onChange)
    return true
  }
  if (numberedMatch) {
    e.preventDefault()
    const nextNum = parseInt(numberedMatch[2] ?? '1') + 1
    insertText(ta, `\n${numberedMatch[1] ?? ''}${nextNum}. `, onChange)
    return true
  }
  return false
}

// ── Hook ──

export function useMarkdownShortcuts(
  onChange: (v: string) => void
): (e: KeyboardEvent<HTMLTextAreaElement>) => void {
  // Keep a stable ref so the handler can always access the latest onChange
  // without re-registering (avoids stale-closure for onChange).
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  return useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    const ta = e.currentTarget
    const oc = onChangeRef.current

    for (const shortcut of SHORTCUT_TABLE) {
      if (shortcut.match(e)) {
        shortcut.handle(e, ta, oc)
        return
      }
    }

    handleEnterAutoContinue(e, ta, oc)
  }, []) // stable — uses onChangeRef, no dependency on onChange
}
