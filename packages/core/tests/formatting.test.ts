import { describe, it, expect } from 'vitest'
import {
  convertInlineChildren,
  convertInlineNode,
  transformStrong,
  transformEmphasis,
  transformDelete,
  transformInlineCode,
  transformImage,
  transformLink,
} from '../src/transforms/formatting.js'
import type { PhrasingContent, Link, Strong, Emphasis, Delete, InlineCode, Image } from 'mdast'

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
    expect(transformInlineCode(code('<div class="x">'))).toBe('{{<div class="x">}}')
  })

  it('preserves Jira macro characters inside code', () => {
    expect(transformInlineCode(code('{code}'))).toBe('{{{code}}}')
  })
})

describe('transformImage', () => {
  const img = (url: string, alt = '', title: string | null = null): Image => ({
    type: 'image',
    url,
    alt,
    title,
  })

  it('wraps url in Jira image syntax', () => {
    expect(transformImage(img('image.png', 'alt'))).toBe('!image.png!')
  })

  it('works with absolute URLs', () => {
    expect(transformImage(img('https://example.com/logo.png'))).toBe(
      '!https://example.com/logo.png!'
    )
  })

  it('returns empty string when url is empty', () => {
    expect(transformImage(img(''))).toBe('')
  })

  it('appends single Jira param from title', () => {
    expect(transformImage(img('img.png', 'alt', 'thumbnail'))).toBe('!img.png|thumbnail!')
  })

  it('appends multiple Jira params from title', () => {
    expect(transformImage(img('img.png', 'alt', 'width=200,height=100'))).toBe(
      '!img.png|width=200,height=100!'
    )
  })

  it('appends params with baseUrl resolution', () => {
    expect(transformImage(img('/banner.png', '', 'align=right'), 'https://wiki.example.com')).toBe(
      '!https://wiki.example.com/banner.png|align=right!'
    )
  })

  it('strips ! from title to prevent tag termination', () => {
    expect(transformImage(img('img.png', '', 'width=200!bad'))).toBe('!img.png|width=200bad!')
  })

  it('strips | from title to prevent extra separator', () => {
    expect(transformImage(img('img.png', '', 'width=200|bad'))).toBe('!img.png|width=200bad!')
  })

  it('omits params when title sanitizes to empty string', () => {
    expect(transformImage(img('img.png', '', '!!||'))).toBe('!img.png!')
  })

  it('null title produces no params', () => {
    expect(transformImage(img('img.png', 'alt', null))).toBe('!img.png!')
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

  it('resolves relative link when baseUrl is provided', () => {
    expect(transformLink(link('/about', [text('About')]), 'https://wiki.example.com')).toBe(
      '[About|https://wiki.example.com/about]'
    )
  })

  it('trims trailing slash from baseUrl when prepending', () => {
    expect(transformLink(link('/docs', [text('Docs')]), 'https://wiki.example.com/')).toBe(
      '[Docs|https://wiki.example.com/docs]'
    )
  })

  it('leaves absolute link unchanged even when baseUrl is provided', () => {
    expect(
      transformLink(link('https://external.com', [text('External')]), 'https://wiki.example.com')
    ).toBe('[External|https://external.com]')
  })

  it('leaves anchor links unchanged when baseUrl is provided', () => {
    expect(transformLink(link('#section', [text('Top')]), 'https://wiki.example.com')).toBe(
      '[Top|#section]'
    )
  })
})

describe('convertInlineNode', () => {
  it('converts text node to its value', () => {
    expect(convertInlineNode(text('hello'))).toBe('hello')
  })

  it('converts image to Jira image syntax', () => {
    const img: PhrasingContent = {
      type: 'image',
      url: 'img.png',
      alt: 'alt',
      title: null,
    }
    expect(convertInlineNode(img)).toBe('!img.png!')
  })

  it('resolves relative image URL with baseUrl', () => {
    const img: PhrasingContent = { type: 'image', url: '/logo.png', alt: '', title: null }
    expect(convertInlineNode(img, 'https://wiki.example.com')).toBe(
      '!https://wiki.example.com/logo.png!'
    )
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
