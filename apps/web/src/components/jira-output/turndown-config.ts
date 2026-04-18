import TurndownService from 'turndown'

/**
 * Creates and configures a TurndownService instance for converting the
 * WYSIWYG editor's HTML back to Markdown.
 *
 * NOTE: The WYSIWYG editor relies on document.execCommand() which is deprecated
 * per the HTML spec (https://developer.mozilla.org/docs/Web/API/Document/execCommand).
 * execCommand() remains the only cross-browser mechanism for formatting a
 * contentEditable element without a full rich-text library. A future migration
 * to TipTap (ProseMirror-based) is recommended to replace both the contentEditable
 * approach and this Turndown HTML→Markdown roundtrip.
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

  td.keep(['sub', 'sup'])

  td.addRule('strikethrough', {
    filter: (node) => ['S', 'DEL', 'STRIKE'].includes(node.nodeName),
    replacement: (content: string) => `~~${content}~~`,
  })

  td.addRule('codeBlockPre', {
    filter: (node) => node.nodeName === 'PRE' && node.querySelector('code') !== null,
    replacement: (_content: string, node: Node) => {
      const code = (node as HTMLElement).querySelector('code')
      return `\n\`\`\`\n${code?.textContent ?? ''}\n\`\`\`\n`
    },
  })

  td.addRule('tableCell', {
    filter: ['th', 'td'] as (keyof HTMLElementTagNameMap)[],
    replacement: (content: string) => ` ${content.replace(/\n/g, ' ').trim()} |`,
  })

  td.addRule('tableRow', {
    filter: 'tr',
    replacement: (content: string, node: Node) => {
      const el = node as HTMLElement
      const isHeader = el.querySelectorAll('th').length > 0
      const row = `|${content}`
      if (isHeader) {
        const count = el.querySelectorAll('th').length
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
