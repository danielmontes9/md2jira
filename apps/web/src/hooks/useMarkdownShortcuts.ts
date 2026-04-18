import { useCallback } from 'react'
import type { KeyboardEvent } from 'react'

/**
 * Returns a keydown handler for the Markdown textarea that implements
 * formatting shortcuts, auto-list continuation, and line manipulation.
 *
 * Uses textarea.setRangeText() for text insertion to avoid the deprecated
 * document.execCommand() API.
 */

// ── Helpers ──

/** Insert text at the current selection, replacing any selected text. */
function insertText(textarea: HTMLTextAreaElement, text: string): void {
  const { selectionStart, selectionEnd } = textarea
  textarea.focus()
  textarea.setRangeText(text, selectionStart, selectionEnd, 'end')
  textarea.dispatchEvent(new Event('input', { bubbles: true }))
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
  textarea: HTMLTextAreaElement,
  lineStart: number,
  lineEnd: number,
  newText: string
) {
  textarea.setRangeText(newText, lineStart, lineEnd, 'end')
  textarea.dispatchEvent(new Event('input', { bubbles: true }))
}

function wrapSelection(
  e: KeyboardEvent<HTMLTextAreaElement>,
  val: string,
  selectionStart: number,
  selectionEnd: number,
  wrapper: string
) {
  e.preventDefault()
  const selected = val.substring(selectionStart, selectionEnd)
  insertText(e.currentTarget, `${wrapper}${selected}${wrapper}`)
}

const ctrlOrMeta = (e: KeyboardEvent<HTMLTextAreaElement>) => e.ctrlKey || e.metaKey

// ── Shortcut table ──

interface ShortcutEntry {
  match: (e: KeyboardEvent<HTMLTextAreaElement>) => boolean
  handle: (e: KeyboardEvent<HTMLTextAreaElement>, ta: HTMLTextAreaElement) => void
}

const SHORTCUT_TABLE: ShortcutEntry[] = [
  // Tab → 2 spaces
  {
    match: (e) => e.key === 'Tab' && !ctrlOrMeta(e) && !e.altKey,
    handle: (e, ta) => {
      e.preventDefault()
      insertText(ta, '  ')
    },
  },
  // Ctrl+B → bold
  {
    match: (e) => e.key === 'b' && ctrlOrMeta(e) && !e.shiftKey && !e.altKey,
    handle: (e) => {
      const { value, selectionStart, selectionEnd } = e.currentTarget
      wrapSelection(e, value, selectionStart, selectionEnd, '**')
    },
  },
  // Ctrl+I → italic
  {
    match: (e) => e.key === 'i' && ctrlOrMeta(e) && !e.shiftKey && !e.altKey,
    handle: (e) => {
      const { value, selectionStart, selectionEnd } = e.currentTarget
      wrapSelection(e, value, selectionStart, selectionEnd, '_')
    },
  },
  // Ctrl+Shift+K → inline code
  {
    match: (e) => e.key === 'k' && ctrlOrMeta(e) && e.shiftKey && !e.altKey,
    handle: (e) => {
      const { value, selectionStart, selectionEnd } = e.currentTarget
      wrapSelection(e, value, selectionStart, selectionEnd, '`')
    },
  },
  // Ctrl+Shift+X → strikethrough
  {
    match: (e) => e.key === 'x' && ctrlOrMeta(e) && e.shiftKey && !e.altKey,
    handle: (e) => {
      const { value, selectionStart, selectionEnd } = e.currentTarget
      wrapSelection(e, value, selectionStart, selectionEnd, '~~')
    },
  },
  // Ctrl+Shift+H → cycle heading h1 → h2 → h3 → none
  {
    match: (e) => e.key === 'h' && ctrlOrMeta(e) && e.shiftKey && !e.altKey,
    handle: (e, ta) => {
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
      replaceLine(ta, lineStart, lineEnd, newLine)
    },
  },
  // Ctrl+Shift+L → toggle bullet list
  {
    match: (e) => e.key === 'l' && ctrlOrMeta(e) && e.shiftKey && !e.altKey,
    handle: (e, ta) => {
      e.preventDefault()
      const { lineStart, lineEnd, text } = getLine(ta.value, ta.selectionStart)
      replaceLine(ta, lineStart, lineEnd, text.startsWith('- ') ? text.substring(2) : `- ${text}`)
    },
  },
  // Ctrl+Shift+O → toggle numbered list
  {
    match: (e) => e.key === 'o' && ctrlOrMeta(e) && e.shiftKey && !e.altKey,
    handle: (e, ta) => {
      e.preventDefault()
      const { lineStart, lineEnd, text } = getLine(ta.value, ta.selectionStart)
      replaceLine(
        ta,
        lineStart,
        lineEnd,
        /^\d+\. /.test(text) ? text.replace(/^\d+\. /, '') : `1. ${text}`
      )
    },
  },
  // Ctrl+Shift+Q → toggle blockquote
  {
    match: (e) => e.key === 'q' && ctrlOrMeta(e) && e.shiftKey && !e.altKey,
    handle: (e, ta) => {
      e.preventDefault()
      const { lineStart, lineEnd, text } = getLine(ta.value, ta.selectionStart)
      replaceLine(ta, lineStart, lineEnd, text.startsWith('> ') ? text.substring(2) : `> ${text}`)
    },
  },
  // Ctrl+Shift+C → insert fenced code block
  {
    match: (e) => e.key === 'c' && ctrlOrMeta(e) && e.shiftKey && !e.altKey,
    handle: (e, ta) => {
      e.preventDefault()
      insertText(ta, '```\n\n```')
      requestAnimationFrame(() => {
        const cur = ta.selectionStart
        ta.selectionStart = ta.selectionEnd = cur - 3
      })
    },
  },
  // Ctrl+Enter → insert blank line below current line
  {
    match: (e) => e.key === 'Enter' && ctrlOrMeta(e) && !e.shiftKey && !e.altKey,
    handle: (e, ta) => {
      e.preventDefault()
      const { lineEnd } = getLine(ta.value, ta.selectionStart)
      ta.selectionStart = ta.selectionEnd = lineEnd
      insertText(ta, '\n')
    },
  },
  // Alt+↑ → move line up
  {
    match: (e) => e.key === 'ArrowUp' && e.altKey && !ctrlOrMeta(e),
    handle: (e, ta) => {
      e.preventDefault()
      const { lineStart, lineEnd, text: currentLine } = getLine(ta.value, ta.selectionStart)
      if (lineStart === 0) return
      const { lineStart: prevStart, text: prevLine } = getLine(ta.value, lineStart - 1)
      const cursorOffset = ta.selectionStart - lineStart
      ta.setRangeText(`${currentLine}\n${prevLine}`, prevStart, lineEnd, 'end')
      ta.dispatchEvent(new Event('input', { bubbles: true }))
      requestAnimationFrame(() => {
        const newPos = prevStart + cursorOffset
        ta.selectionStart = ta.selectionEnd = newPos
      })
    },
  },
  // Alt+↓ → move line down
  {
    match: (e) => e.key === 'ArrowDown' && e.altKey && !ctrlOrMeta(e),
    handle: (e, ta) => {
      e.preventDefault()
      const val = ta.value
      const { lineStart, lineEnd, text: currentLine } = getLine(val, ta.selectionStart)
      if (lineEnd === val.length) return
      const nextStart = lineEnd + 1
      const nextEndRaw = val.indexOf('\n', nextStart)
      const nextEnd = nextEndRaw === -1 ? val.length : nextEndRaw
      const nextLine = val.substring(nextStart, nextEnd)
      const cursorOffset = ta.selectionStart - lineStart
      ta.setRangeText(`${nextLine}\n${currentLine}`, lineStart, nextEnd, 'end')
      ta.dispatchEvent(new Event('input', { bubbles: true }))
      requestAnimationFrame(() => {
        const newPos = lineStart + nextLine.length + 1 + cursorOffset
        ta.selectionStart = ta.selectionEnd = newPos
      })
    },
  },
  // Ctrl+D → duplicate line
  {
    match: (e) => e.key === 'd' && ctrlOrMeta(e) && !e.shiftKey && !e.altKey,
    handle: (e, ta) => {
      e.preventDefault()
      const { lineEnd, text } = getLine(ta.value, ta.selectionStart)
      ta.selectionStart = ta.selectionEnd = lineEnd
      insertText(ta, `\n${text}`)
    },
  },
]

// ── Enter → auto-continue list item (context-dependent, handled separately) ──

function handleEnterAutoContinue(
  e: KeyboardEvent<HTMLTextAreaElement>,
  ta: HTMLTextAreaElement
): boolean {
  if (e.key !== 'Enter' || ctrlOrMeta(e) || e.shiftKey || e.altKey) return false
  const { selectionStart, selectionEnd, value: val } = ta
  if (selectionStart !== selectionEnd) return false

  const { lineStart, lineEnd, text } = getLine(val, selectionStart)
  if (selectionStart !== lineEnd) return false

  const bulletMatch = text.match(/^(\s*)([-*]) (.+)$/)
  const numberedMatch = text.match(/^(\s*)(\d+)\. (.+)$/)
  const emptyBullet = text.match(/^(\s*)([-*]) $/)
  const emptyNumbered = text.match(/^(\s*)(\d+)\. $/)
  // Task list patterns — must be checked BEFORE bulletMatch since `- [ ] text`
  // also matches the generic bullet regex.
  const taskMatch = text.match(/^(\s*)([-*]) \[[ x]\] (.+)$/)
  const emptyTask = text.match(/^(\s*)([-*]) \[[ x]\]\s*$/)

  if (emptyTask || emptyBullet || emptyNumbered) {
    e.preventDefault()
    replaceLine(ta, lineStart, lineEnd, '')
    return true
  }
  if (taskMatch) {
    e.preventDefault()
    insertText(ta, `\n${taskMatch[1]}${taskMatch[2]} [ ] `)
    return true
  }
  if (bulletMatch) {
    e.preventDefault()
    insertText(ta, `\n${bulletMatch[1]}${bulletMatch[2]} `)
    return true
  }
  if (numberedMatch) {
    e.preventDefault()
    const nextNum = parseInt(numberedMatch[2] ?? '1') + 1
    insertText(ta, `\n${numberedMatch[1] ?? ''}${nextNum}. `)
    return true
  }
  return false
}

// ── Hook ──

export function useMarkdownShortcuts(): (e: KeyboardEvent<HTMLTextAreaElement>) => void {
  return useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    const ta = e.currentTarget

    for (const shortcut of SHORTCUT_TABLE) {
      if (shortcut.match(e)) {
        shortcut.handle(e, ta)
        return
      }
    }

    handleEnterAutoContinue(e, ta)
  }, [])
}
