/**
 * HTML template strings for the InsertMenu panel items.
 *
 * Defined as named constants so changes to styling only need to happen here,
 * and the strings are easily unit-testable.
 */

// Inline `style` attributes are stripped by DOMPurify when the HTML is
// injected into the TipTap editor via insertHtml → sanitize().
// Visual styling is applied via CSS rules in jira-preview.css using the
// data-type attribute selector so it survives sanitization.
export const INFO_PANEL_HTML = '<div data-type="info-panel"><p>ℹ️ Info panel</p></div><p><br></p>'

export const DECISION_PANEL_HTML =
  '<div data-type="decision-panel"><p>📋 Decision: </p></div><p><br></p>'
