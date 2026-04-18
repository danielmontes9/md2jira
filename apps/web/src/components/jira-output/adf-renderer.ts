import type {
  AdfDocument,
  AdfBlockNode,
  AdfInlineNode,
  AdfMark,
  AdfListItemNode,
  AdfTextNode,
  AdfTableRowNode,
  AdfTableHeaderNode,
  AdfTableCellNode,
} from 'md2jira-core'

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
  let html = node.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
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

export function adfBlockToHtml(node: AdfBlockNode): string {
  switch (node.type) {
    case 'heading':
      return `<h${node.attrs.level}>${node.content.map(adfInlineToHtml).join('')}</h${node.attrs.level}>`
    case 'paragraph':
      return `<p>${node.content.map(adfInlineToHtml).join('')}</p>`
    case 'bulletList':
      return `<ul>${node.content.map((item: AdfListItemNode) => `<li>${item.content.map(adfBlockToHtml).join('')}</li>`).join('')}</ul>`
    case 'orderedList':
      return `<ol>${node.content.map((item: AdfListItemNode) => `<li>${item.content.map(adfBlockToHtml).join('')}</li>`).join('')}</ol>`
    case 'codeBlock':
      return `<pre><code>${node.content.map((t: AdfTextNode) => t.text).join('')}</code></pre>`
    case 'blockquote':
      return `<blockquote>${node.content.map(adfBlockToHtml).join('')}</blockquote>`
    case 'rule':
      return '<hr>'
    case 'table': {
      const rows = node.content.map((row: AdfTableRowNode) => {
        const cells = row.content.map((cell: AdfTableHeaderNode | AdfTableCellNode) => {
          const tag = cell.type === 'tableHeader' ? 'th' : 'td'
          const inner = cell.content.map(adfBlockToHtml).join('')
          return `<${tag}>${inner}</${tag}>`
        })
        return `<tr>${cells.join('')}</tr>`
      })
      return `<table>${rows.join('')}</table>`
    }
    default:
      return ''
  }
}

export function adfToHtml(doc: AdfDocument): string {
  return doc.content.map(adfBlockToHtml).join('')
}
