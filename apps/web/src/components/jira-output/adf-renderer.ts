import type {
  AdfDocument,
  AdfBlockNode,
  AdfInlineNode,
  AdfMark,
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
        case 'link': {
          const href = sanitizeUrl((mark as AdfMark & { attrs: { href: string } }).attrs.href)
          const safeHref = href.replace(/"/g, '%22')
          html = `<a href="${safeHref}">${html}</a>`
          break
        }
        case 'subsup': {
          const subsupType = (mark as AdfMark & { attrs: { type: 'sub' | 'sup' } }).attrs?.type
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
    const lang = (node.attrs as { language?: string } | undefined)?.language
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
        return `<li data-type="taskItem"><label><input type="checkbox"${item.attrs.state === 'DONE' ? ' checked' : ''} disabled> ${inlineHtml}</label></li>`
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
  // The `| undefined` cast handles external ADF payloads that may contain node
  // types not present in the compile-time union — those fall back to empty string.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handler = BLOCK_HANDLERS[node.type] as ((node: any) => string) | undefined
  return handler ? handler(node) : ''
}

/**
 * Converts a full ADF document to an HTML string.
 *
 * Performance: currently synchronous on the main thread, but wrapped with
 * `useDeferredValue` in App.tsx so it yields to user input. The actual
 * conversion is O(n) over ADF nodes and fast for typical Jira documents.
 *
 * Web Worker migration (for documents > ~500 nodes):
 *
 * 1. Create `apps/web/src/workers/adf-worker.ts`:
 *    ```ts
 *    import { adfToHtml } from '../components/jira-output/adf-renderer.js'
 *    self.onmessage = (e: MessageEvent<AdfDocument>) => {
 *      self.postMessage(adfToHtml(e.data))
 *    }
 *    ```
 *
 * 2. In App.tsx, instantiate with:
 *    ```ts
 *    const worker = new Worker(
 *      new URL('../workers/adf-worker.ts', import.meta.url),
 *      { type: 'module' }
 *    )
 *    ```
 *
 * 3. Post ADF doc to worker, receive HTML string via `onmessage`.
 *    The function is pure (no DOM access), making it safe to run off-thread.
 */
export function adfToHtml(doc: AdfDocument): string {
  return doc.content.map(adfBlockToHtml).join('')
}
