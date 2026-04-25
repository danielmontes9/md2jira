import { describe, it, expect } from 'vitest'
import { transformBlockquote } from '../src/transforms/blockquotes.js'
import type { Blockquote, PhrasingContent } from 'mdast'

const text = (value: string): PhrasingContent => ({ type: 'text', value })

function para(children: PhrasingContent[]) {
  return { type: 'paragraph' as const, children }
}

function bq(children: Blockquote['children']): Blockquote {
  return { type: 'blockquote', children }
}

describe('transformBlockquote', () => {
  it('converts a simple blockquote', () => {
    expect(transformBlockquote(bq([para([text('some text')])]))).toBe('bq. some text')
  })

  it('handles empty blockquote', () => {
    expect(transformBlockquote(bq([]))).toBe('')
  })

  it('converts blockquote with bold formatting', () => {
    const node = bq([
      para([{ type: 'strong', children: [text('bold')] }, text(' quote')]),
    ])
    expect(transformBlockquote(node)).toBe('bq. *bold* quote')
  })

  it('converts blockquote with inline code', () => {
    const node = bq([para([text('Use '), { type: 'inlineCode', value: 'code' }, text(' here')])])
    expect(transformBlockquote(node)).toBe('bq. Use {{code}} here')
  })

  it('emits separate bq. lines for multiple paragraphs in a blockquote', () => {
    const node = bq([para([text('Line 1')]), para([text('Line 2')])])
    expect(transformBlockquote(node)).toBe('bq. Line 1\nbq. Line 2')
  })

  it('flattens nested blockquote (Jira has no nested bq. syntax)', () => {
    const inner = bq([para([text('inner')])])
    const outer = bq([inner])
    expect(transformBlockquote(outer)).toBe('bq. inner')
  })

  it('emits a list inside a blockquote without bq. prefix (Jira limitation)', () => {
    const list = {
      type: 'list' as const,
      ordered: false,
      start: null,
      spread: false,
      children: [
        {
          type: 'listItem' as const,
          checked: null,
          spread: false,
          children: [para([text('Item')])],
        },
      ],
    }
    const node = bq([list])
    expect(transformBlockquote(node)).toBe('* Item')
  })

  it('emits a code block inside a blockquote without bq. prefix (Jira limitation)', () => {
    const code = { type: 'code' as const, lang: 'js', meta: null, value: 'const x = 1' }
    const node = bq([code])
    expect(transformBlockquote(node)).toBe('{code:language=js}\nconst x = 1\n{code}')
  })
})
