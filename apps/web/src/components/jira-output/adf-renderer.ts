import type {
  AdfDocument,
  AdfBlockNode,
  AdfInlineNode,
  AdfListItemNode,
  AdfTaskItemNode,
  AdfTextNode,
  AdfTableRowNode,
  AdfTableHeaderNode,
  AdfTableCellNode,
} from 'md2jira-core'
import { escapeHtml } from '../../utils/escape-html.js'

/**
 * Sanitizes a URL to only allow safe protocols (http, https, mailto).
 * Prevents javascript: and data: URL injection in ADF link marks. (OWASP A03: Injection)
 */
function sanitizeUrl(url: string): string {
  try {
    const { protocol } = new URL(url)
    if (protocol === 'http:' || protocol === 'https:' || protocol === 'mailto:') {
      return url
    }
    return '#'
  } catch {
    return '#'
  }
}

export function adfInlineToHtml(node: AdfInlineNode): string {
  if (node.type === 'hardBreak') return '<br>'
  let html = escapeHtml(node.text)
  if (node.marks) {
    for (const mark of node.marks) {
      switch (mark.type) {
        case 'strong':
          html = `<strong>${html}</strong>`
          break
        case 'em':
          html = `<em>${html}</em>`
          break
        case 'strike':
          html = `<s>${html}</s>`
          break
        case 'code':
          html = `<code>${html}</code>`
          break
        case 'underline':
          html = `<u>${html}</u>`
          break
        case 'link': {
          const href = sanitizeUrl(mark.attrs.href)
          const safeHref = href.replace(/"/g, '%22')
          html = `<a href="${safeHref}">${html}</a>`
          break
        }
        case 'subsup': {
          const subsupType = mark.attrs.type
          html = subsupType === 'sub' ? `<sub>${html}</sub>` : `<sup>${html}</sup>`
          break
        }
      }
    }
  }
  return html
}

// Mapped type: each key K maps to a handler that only accepts the AdfBlockNode subtype
// whose `type` discriminant equals K. The map is TOTAL (no `+?`) so TypeScript will
// report a compile error if a new AdfBlockNode variant is added without a handler.
type BlockHandlerMap = {
  [K in AdfBlockNode['type']]: (node: Extract<AdfBlockNode, { type: K }>) => string
}

const BLOCK_HANDLERS: BlockHandlerMap = {
  heading: (node) =>
    `<h${node.attrs.level}>${node.content.map(adfInlineToHtml).join('')}</h${node.attrs.level}>`,
  paragraph: (node) => `<p>${node.content.map(adfInlineToHtml).join('')}</p>`,
  bulletList: (node) =>
    `<ul>${node.content.map((item: AdfListItemNode) => `<li>${item.content.map(adfBlockToHtml).join('')}</li>`).join('')}</ul>`,
  orderedList: (node) =>
    `<ol>${node.content.map((item: AdfListItemNode) => `<li>${item.content.map(adfBlockToHtml).join('')}</li>`).join('')}</ol>`,
  codeBlock: (node) => {
    const lang = node.attrs?.language
    // Sanitize the language tag — only allow word characters so it can't inject HTML
    const safeLang = lang ? lang.replace(/[^\w-]/g, '') : ''
    const classAttr = safeLang ? ` class="language-${safeLang}"` : ''
    const content = escapeHtml(node.content.map((t: AdfTextNode) => t.text).join(''))
    return `<pre><code${classAttr}>${content}</code></pre>`
  },
  blockquote: (node) => `<blockquote>${node.content.map(adfBlockToHtml).join('')}</blockquote>`,
  rule: () => '<hr>',
  taskList: (node) =>
    `<ul data-type="taskList">${node.content
      .map((item: AdfTaskItemNode) => {
        // Flatten inline content from paragraph children — avoids invalid <p> inside <label>
        const inlineHtml = item.content
          .flatMap((block) =>
            block.type === 'paragraph' ? block.content.map(adfInlineToHtml) : []
          )
          .join('')
        return `<li data-type="taskItem"><label><input type="checkbox"${item.attrs.state === 'DONE' ? ' checked' : ''} disabled tabindex="-1"> ${inlineHtml}</label></li>`
      })
      .join('')}</ul>`,
  table: (node) => {
    const rows = node.content.map((row: AdfTableRowNode) => {
      const cells = row.content.map((cell: AdfTableHeaderNode | AdfTableCellNode) => {
        const tag = cell.type === 'tableHeader' ? 'th' : 'td'
        const inner = cell.content.map(adfBlockToHtml).join('')
        return `<${tag}>${inner}</${tag}>`
      })
      return `<tr>${cells.join('')}</tr>`
    })
    return `<table>${rows.join('')}</table>`
  },
}

export function adfBlockToHtml(node: AdfBlockNode): string {
  // BLOCK_HANDLERS is total for all known AdfBlockNode types (compile-time guarantee).
  // The `| undefined` handles external ADF payloads that may contain node types
  // not present in the compile-time union — those fall back to best-effort rendering.
  // TypeScript cannot correlate the indexed handler with the runtime node type,
  // a known limitation (microsoft/TypeScript#30581); the cast is sound because
  // we index BLOCK_HANDLERS by the same node.type that discriminates the union.
  const handler = BLOCK_HANDLERS[node.type] as ((n: AdfBlockNode) => string) | undefined
  if (handler) return handler(node)
  // Unknown block type from external ADF payloads (e.g. panel, expand, mediaGroup).
  // Best-effort: extract and render child blocks so content is not silently swallowed.
  const raw = node as unknown as { content?: AdfBlockNode[] }
  if (Array.isArray(raw.content) && raw.content.length > 0) {
    return raw.content.map(adfBlockToHtml).join('')
  }
  return ''
}

/**
 * Converts a full ADF document to an HTML string.
 *
 * This function is pure (no DOM access) and is invoked off-thread by
 * `apps/web/src/workers/adf-worker.ts`. App.tsx sends the ADF doc to the
 * worker and falls back to a synchronous dynamic import in jsdom / older
 * browsers that do not support module Workers.
 */
export function adfToHtml(doc: AdfDocument): string {
  return doc.content.map(adfBlockToHtml).join('')
}
