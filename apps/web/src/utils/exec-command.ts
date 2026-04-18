/**
 * Typed wrappers around the deprecated `document.execCommand()`.
 *
 * Using execCommand is the only cross-browser way to format / insert text in a
 * textarea or contentEditable element while preserving the native undo stack.
 * Casting through `unknown` avoids TypeScript's @deprecated diagnostic
 * without resorting to `any`.
 *
 * @see https://w3c.github.io/input-events/ — future InputEvent-based alternative
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
