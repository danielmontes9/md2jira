import TurndownService from 'turndown'

/**
 * Type-safe cast helper. The Turndown rule `filter` callback pre-validates
 * `node.nodeName` before this is called, so the cast is always sound.
 */
function asElement(node: Node): HTMLElement {
  return node as HTMLElement
}

/**
 * Creates and configures a TurndownService instance for converting the
 * WYSIWYG editor's HTML back to Markdown.
 *
 * Used by useTiptapEditor: when the user edits content in the TipTap editor,
 * the result of editor.getHTML() is converted back to Markdown via this service
 * so the Markdown input panel and the ?md= URL param stay in sync.
 *
 * Future: replace with a ProseMirror-native Markdown serializer to eliminate
 * this HTML→Markdown roundtrip and reduce the Turndown + DOMPurify bundle cost.
 */
export function createTurndownService(): TurndownService {
  const td = new TurndownService({
    headingStyle: 'atx',
    hr: '---',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    fence: '```',
    emDelimiter: '_',
    strongDelimiter: '**',
  })

  // Keep sub/sup elements and <span style="color:..."> written by TipTap's Color
  // extension. Standard Markdown has no color syntax; keeping the span preserves
  // it in the Markdown state so the editor can re-apply the color within a session.
  //
  // LIMITATION: These spans are treated as raw HTML nodes by convert() /
  // convertToAdf() (HTML passthrough is explicitly out of scope). If the user
  // switches out of edit mode while colored text is active, the ADF pipeline
  // re-syncs the editor content without color — color is WYSIWYG-only and does
  // not survive the Markdown → Jira conversion pipeline.
  td.keep(['sub', 'sup', 'span'])

  // Info panel: inserted by InsertMenu as <div data-type="info-panel">.
  // Preserved as a blockquote in Markdown — the closest plain-text equivalent.
  // Jira Wiki converts it to `bq.`; ADF converts it to a blockquote node.
  // Uses the pre-processed `content` argument (already converted by Turndown's
  // recursive pass) so bold, links, code etc. inside the panel are preserved.
  td.addRule('infoPanel', {
    filter: (node) =>
      node.nodeName === 'DIV' && asElement(node).getAttribute('data-type') === 'info-panel',
    replacement: (content: string) => {
      return `\n\n> ${content.trim()}\n\n`
    },
  })

  // Task list items: <li data-type="taskItem" data-checked="true|false">
  // Must be registered before the generic bullet-list rules so the more specific
  // filter wins (Turndown checks rules in registration order).
  td.addRule('taskListItem', {
    filter: (node) =>
      node.nodeName === 'LI' && asElement(node).getAttribute('data-type') === 'taskItem',
    replacement: (content: string, node: Node) => {
      const el = asElement(node)
      const checked = el.getAttribute('data-checked') === 'true'
      const text = content.replace(/\n+/g, ' ').trim()
      return `\n- [${checked ? 'x' : ' '}] ${text}`
    },
  })

  td.addRule('taskList', {
    filter: (node) =>
      node.nodeName === 'UL' && asElement(node).getAttribute('data-type') === 'taskList',
    replacement: (content: string) => `\n\n${content.trim()}\n\n`,
  })

  td.addRule('strikethrough', {
    filter: (node) => ['S', 'DEL', 'STRIKE'].includes(node.nodeName),
    replacement: (content: string) => `~~${content}~~`,
  })

  td.addRule('codeBlockPre', {
    filter: (node) => node.nodeName === 'PRE' && node.querySelector('code') !== null,
    replacement: (_content: string, node: Node) => {
      const code = asElement(node).querySelector('code')
      // Recover the language from the `language-*` class injected by adf-renderer
      const lang =
        Array.from(code?.classList ?? [])
          .find((c) => c.startsWith('language-'))
          ?.slice('language-'.length) ?? ''
      return `\n\`\`\`${lang}\n${code?.textContent ?? ''}\n\`\`\`\n`
    },
  })

  td.addRule('tableCell', {
    filter: ['th', 'td'] as (keyof HTMLElementTagNameMap)[],
    replacement: (content: string) => ` ${content.replace(/\n/g, ' ').trim()} |`,
  })

  td.addRule('tableRow', {
    filter: 'tr',
    replacement: (content: string, node: Node) => {
      const el = asElement(node)
      const isHeader = el.querySelectorAll('th').length > 0
      const row = `|${content}`
      if (isHeader) {
        // Count all direct cell children (th + td) — TipTap may emit td even in header rows
        const count = el.querySelectorAll('th, td').length
        const sep = `| ${Array(count).fill('---').join(' | ')} |`
        return `\n${row}\n${sep}`
      }
      return `\n${row}`
    },
  })

  td.addRule('table', {
    filter: 'table',
    replacement: (content: string) => `\n\n${content.trim()}\n\n`,
  })

  return td
}
