import { describe, it, expect } from 'vitest'
import {
  convertInlineChildren,
  convertInlineNode,
  transformStrong,
  transformEmphasis,
  transformDelete,
  transformInlineCode,
  transformLink,
} from '../src/transforms/formatting.js'
import type { PhrasingContent, Link, Strong, Emphasis, Delete, InlineCode } from 'mdast'

const text = (value: string): PhrasingContent => ({ type: 'text', value })
const strong = (children: PhrasingContent[]): Strong => ({ type: 'strong', children })
const em = (children: PhrasingContent[]): Emphasis => ({ type: 'emphasis', children })
const del = (children: PhrasingContent[]): Delete => ({ type: 'delete', children })
const code = (value: string): InlineCode => ({ type: 'inlineCode', value })
const link = (url: string, children: PhrasingContent[]): Link => ({
  type: 'link',
  url,
  title: null,
  children,
})

describe('transformStrong', () => {
  it('wraps text in asterisks', () => {
    expect(transformStrong(strong([text('bold')]))).toBe('*bold*')
  })

  it('handles nested emphasis inside bold', () => {
    expect(transformStrong(strong([em([text('italic')])]))).toBe('*_italic_*')
  })

  it('handles empty children', () => {
    expect(transformStrong(strong([]))).toBe('**')
  })
})

describe('transformEmphasis', () => {
  it('wraps text in underscores', () => {
    expect(transformEmphasis(em([text('italic')]))).toBe('_italic_')
  })

  it('handles nested bold inside italic', () => {
    expect(transformEmphasis(em([strong([text('bold')])]))).toBe('_*bold*_')
  })
})

describe('transformDelete', () => {
  it('wraps text in dashes', () => {
    expect(transformDelete(del([text('strike')]))).toBe('-strike-')
  })

  it('handles empty children', () => {
    expect(transformDelete(del([]))).toBe('--')
  })
})

describe('transformInlineCode', () => {
  it('wraps value in double curly braces', () => {
    expect(transformInlineCode(code('myVar'))).toBe('{{myVar}}')
  })

  it('preserves HTML special characters inside code', () => {
    expect(transformInlineCode(code('<div class="x">') )).toBe('{{<div class="x">}}')
  })

  it('preserves Jira macro characters inside code', () => {
    expect(transformInlineCode(code('{code}'))).toBe('{{{code}}}')
  })
})

describe('transformLink', () => {
  it('converts link with text to [text|url]', () => {
    expect(transformLink(link('https://example.com', [text('Example')]))).toBe(
      '[Example|https://example.com]'
    )
  })

  it('converts empty-text link to [url]', () => {
    expect(transformLink(link('https://example.com', []))).toBe('[https://example.com]')
  })

  it('converts link with formatted text', () => {
    expect(transformLink(link('https://example.com', [strong([text('bold')])]))).toBe(
      '[*bold*|https://example.com]'
    )
  })
})

describe('convertInlineNode', () => {
  it('converts text node to its value', () => {
    expect(convertInlineNode(text('hello'))).toBe('hello')
  })

  it('converts image to empty string (silently ignored)', () => {
    const img: PhrasingContent = {
      type: 'image',
      url: 'img.png',
      alt: 'alt',
      title: null,
    }
    expect(convertInlineNode(img)).toBe('')
  })

  it('converts line break to newline', () => {
    expect(convertInlineNode({ type: 'break' })).toBe('\n')
  })

  it('returns empty string for unknown node type', () => {
    // Cast to satisfy TS — real-world unknown nodes may arrive from plugins
    const unknown = { type: 'unknown' } as unknown as PhrasingContent
    expect(convertInlineNode(unknown)).toBe('')
  })
})

describe('convertInlineChildren', () => {
  it('concatenates multiple inline nodes', () => {
    const nodes: PhrasingContent[] = [text('Hello '), strong([text('World')])]
    expect(convertInlineChildren(nodes)).toBe('Hello *World*')
  })

  it('returns empty string for an empty array', () => {
    expect(convertInlineChildren([])).toBe('')
  })

  it('handles all formatting types together', () => {
    const nodes: PhrasingContent[] = [
      strong([text('bold')]),
      text(' and '),
      em([text('italic')]),
      text(' and '),
      code('code'),
    ]
    expect(convertInlineChildren(nodes)).toBe('*bold* and _italic_ and {{code}}')
  })
})
