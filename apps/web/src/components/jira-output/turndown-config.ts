import TurndownService from 'turndown'

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

  td.keep(['sub', 'sup'])

  td.addRule('strikethrough', {
    filter: (node) => ['S', 'DEL', 'STRIKE'].includes(node.nodeName),
    replacement: (content: string) => `~~${content}~~`,
  })

  td.addRule('codeBlockPre', {
    filter: (node) => node.nodeName === 'PRE' && node.querySelector('code') !== null,
    replacement: (_content: string, node: Node) => {
      const code = (node as HTMLElement).querySelector('code')
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
