/**
 * Thin wrapper around the deprecated `document.execCommand('insertText')`.
 *
 * Using execCommand is the only cross-browser way to insert text into a
 * textarea / contentEditable element while preserving the native undo stack.
 * The cast through `unknown` avoids TypeScript's @deprecated diagnostic
 * without resorting to `any`.
 *
 * @see https://w3c.github.io/input-events/ — future InputEvent-based alternative
 */
export function execInsertText(text: string): boolean {
  return (
    document as unknown as { execCommand(cmd: string, showUI: boolean, value: string): boolean }
  ).execCommand('insertText', false, text)
}
