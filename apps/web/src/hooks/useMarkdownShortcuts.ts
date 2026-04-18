import { useCallback } from 'react'
import type { KeyboardEvent } from 'react'

/**
 * Returns a keydown handler for the Markdown textarea that implements
 * formatting shortcuts, auto-list continuation, and line manipulation.
 *
 * NOTE: uses document.execCommand('insertText') to preserve the native
 * undo/redo stack. execCommand is deprecated — track InputEvent-based
 * alternatives (TipTap, Lexical, ProseMirror) for a future migration.
 * See https://w3c.github.io/input-events/
 */
export function useMarkdownShortcuts(): (e: KeyboardEvent<HTMLTextAreaElement>) => void {
  return useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget
    const { selectionStart, selectionEnd, value: val } = textarea

    // Casting drops the @deprecated tag without using `any`.
    const execInsert = (text: string) => {
      const exec = (
        document as unknown as { execCommand(cmd: string, showUI: boolean, value: string): boolean }
      ).execCommand
      exec.call(document, 'insertText', false, text)
    }

    const getLine = (pos: number) => {
      const lineStart = val.lastIndexOf('\n', pos - 1) + 1
      const lineEndRaw = val.indexOf('\n', pos)
      const lineEnd = lineEndRaw === -1 ? val.length : lineEndRaw
      return { lineStart, lineEnd, text: val.substring(lineStart, lineEnd) }
    }

    const replaceLine = (lineStart: number, lineEnd: number, newText: string) => {
      textarea.selectionStart = lineStart
      textarea.selectionEnd = lineEnd
      execInsert(newText)
    }

    const wrapSelection = (wrapper: string) => {
      e.preventDefault()
      const selected = val.substring(selectionStart, selectionEnd)
      execInsert(`${wrapper}${selected}${wrapper}`)
    }

    const ctrlOrMeta = e.ctrlKey || e.metaKey

    // Tab → 2 spaces
    if (e.key === 'Tab' && !ctrlOrMeta && !e.altKey) {
      e.preventDefault()
      execInsert('  ')
      return
    }

    // Ctrl+B → bold
    if (e.key === 'b' && ctrlOrMeta && !e.shiftKey && !e.altKey) {
      wrapSelection('**')
      return
    }

    // Ctrl+I → italic
    if (e.key === 'i' && ctrlOrMeta && !e.shiftKey && !e.altKey) {
      wrapSelection('_')
      return
    }

    // Ctrl+Shift+K → inline code
    if (e.key === 'k' && ctrlOrMeta && e.shiftKey && !e.altKey) {
      wrapSelection('`')
      return
    }

    // Ctrl+Shift+X → strikethrough
    if (e.key === 'x' && ctrlOrMeta && e.shiftKey && !e.altKey) {
      wrapSelection('~~')
      return
    }

    // Ctrl+Shift+H → cycle heading h1 → h2 → h3 → none
    if (e.key === 'h' && ctrlOrMeta && e.shiftKey && !e.altKey) {
      e.preventDefault()
      const { lineStart, lineEnd, text } = getLine(selectionStart)
      const match = text.match(/^(#{1,6}) /)
      let newLine: string
      if (!match || !match[0] || !match[1]) {
        newLine = `# ${text}`
      } else if (match[1].length >= 3) {
        newLine = text.replace(/^#{1,6} /, '')
      } else {
        newLine = `${'#'.repeat(match[1].length + 1)} ${text.substring(match[0].length)}`
      }
      replaceLine(lineStart, lineEnd, newLine)
      return
    }

    // Ctrl+Shift+L → toggle bullet list
    if (e.key === 'l' && ctrlOrMeta && e.shiftKey && !e.altKey) {
      e.preventDefault()
      const { lineStart, lineEnd, text } = getLine(selectionStart)
      replaceLine(lineStart, lineEnd, text.startsWith('- ') ? text.substring(2) : `- ${text}`)
      return
    }

    // Ctrl+Shift+O → toggle numbered list
    if (e.key === 'o' && ctrlOrMeta && e.shiftKey && !e.altKey) {
      e.preventDefault()
      const { lineStart, lineEnd, text } = getLine(selectionStart)
      replaceLine(
        lineStart,
        lineEnd,
        /^\d+\. /.test(text) ? text.replace(/^\d+\. /, '') : `1. ${text}`
      )
      return
    }

    // Ctrl+Shift+Q → toggle blockquote
    if (e.key === 'q' && ctrlOrMeta && e.shiftKey && !e.altKey) {
      e.preventDefault()
      const { lineStart, lineEnd, text } = getLine(selectionStart)
      replaceLine(lineStart, lineEnd, text.startsWith('> ') ? text.substring(2) : `> ${text}`)
      return
    }

    // Ctrl+Shift+C → insert fenced code block
    if (e.key === 'c' && ctrlOrMeta && e.shiftKey && !e.altKey) {
      e.preventDefault()
      execInsert('```\n\n```')
      requestAnimationFrame(() => {
        const cur = textarea.selectionStart
        textarea.selectionStart = textarea.selectionEnd = cur - 3
      })
      return
    }

    // Ctrl+Enter → insert blank line below current line
    if (e.key === 'Enter' && ctrlOrMeta && !e.shiftKey && !e.altKey) {
      e.preventDefault()
      const { lineEnd } = getLine(selectionStart)
      textarea.selectionStart = textarea.selectionEnd = lineEnd
      execInsert('\n')
      return
    }

    // Alt+↑ → move line up
    if (e.key === 'ArrowUp' && e.altKey && !ctrlOrMeta) {
      e.preventDefault()
      const { lineStart, lineEnd, text: currentLine } = getLine(selectionStart)
      if (lineStart === 0) return
      const { lineStart: prevStart, text: prevLine } = getLine(lineStart - 1)
      const cursorOffset = selectionStart - lineStart
      textarea.selectionStart = prevStart
      textarea.selectionEnd = lineEnd
      execInsert(`${currentLine}\n${prevLine}`)
      requestAnimationFrame(() => {
        const newPos = prevStart + cursorOffset
        textarea.selectionStart = textarea.selectionEnd = newPos
      })
      return
    }

    // Alt+↓ → move line down
    if (e.key === 'ArrowDown' && e.altKey && !ctrlOrMeta) {
      e.preventDefault()
      const { lineStart, lineEnd, text: currentLine } = getLine(selectionStart)
      if (lineEnd === val.length) return
      const nextStart = lineEnd + 1
      const nextEndRaw = val.indexOf('\n', nextStart)
      const nextEnd = nextEndRaw === -1 ? val.length : nextEndRaw
      const nextLine = val.substring(nextStart, nextEnd)
      const cursorOffset = selectionStart - lineStart
      textarea.selectionStart = lineStart
      textarea.selectionEnd = nextEnd
      execInsert(`${nextLine}\n${currentLine}`)
      requestAnimationFrame(() => {
        const newPos = lineStart + nextLine.length + 1 + cursorOffset
        textarea.selectionStart = textarea.selectionEnd = newPos
      })
      return
    }

    // Ctrl+D → duplicate line
    if (e.key === 'd' && ctrlOrMeta && !e.shiftKey && !e.altKey) {
      e.preventDefault()
      const { lineEnd, text } = getLine(selectionStart)
      textarea.selectionStart = textarea.selectionEnd = lineEnd
      execInsert(`\n${text}`)
      return
    }

    // Enter → auto-continue list item
    if (
      e.key === 'Enter' &&
      !ctrlOrMeta &&
      !e.shiftKey &&
      !e.altKey &&
      selectionStart === selectionEnd
    ) {
      const { lineStart, lineEnd, text } = getLine(selectionStart)
      if (selectionStart !== lineEnd) return

      const bulletMatch = text.match(/^(\s*)([-*]) (.+)$/)
      const numberedMatch = text.match(/^(\s*)(\d+)\. (.+)$/)
      const emptyBullet = text.match(/^(\s*)([-*]) $/)
      const emptyNumbered = text.match(/^(\s*)(\d+)\. $/)

      if (emptyBullet || emptyNumbered) {
        e.preventDefault()
        replaceLine(lineStart, lineEnd, '')
        return
      }
      if (bulletMatch) {
        e.preventDefault()
        execInsert(`\n${bulletMatch[1]}${bulletMatch[2]} `)
        return
      }
      if (numberedMatch) {
        e.preventDefault()
        const nextNum = parseInt(numberedMatch[2] ?? '1') + 1
        execInsert(`\n${numberedMatch[1] ?? ''}${nextNum}. `)
        return
      }
    }
  }, [])
}
