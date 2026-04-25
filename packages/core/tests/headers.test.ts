import { describe, it, expect } from 'vitest'
import { transformHeading } from '../src/transforms/headers.js'
import type { Heading, PhrasingContent } from 'mdast'

const text = (value: string): PhrasingContent => ({ type: 'text', value })

function heading(depth: 1 | 2 | 3 | 4 | 5 | 6, children: PhrasingContent[]): Heading {
  return { type: 'heading', depth, children }
}

describe('transformHeading', () => {
  it('converts h1 through h6', () => {
    for (let d = 1; d <= 6; d++) {
      expect(transformHeading(heading(d as 1 | 2 | 3 | 4 | 5 | 6, [text('Title')]))).toBe(
        `h${d}. Title`
      )
    }
  })

  it('returns null for an empty heading', () => {
    expect(transformHeading(heading(1, [text('')]))).toBeNull()
  })

  it('returns null for a whitespace-only heading', () => {
    expect(transformHeading(heading(2, [text('   ')]))).toBeNull()
  })

  it('includes bold inline formatting', () => {
    const node = heading(1, [{ type: 'strong', children: [text('Bold')] }, text(' Title')])
    expect(transformHeading(node)).toBe('h1. *Bold* Title')
  })

  it('includes inline code in heading', () => {
    const node = heading(3, [text('Config '), { type: 'inlineCode', value: 'options' }])
    expect(transformHeading(node)).toBe('h3. Config {{options}}')
  })

  it('includes a link in heading', () => {
    const node = heading(1, [
      { type: 'link', url: 'https://example.com', title: null, children: [text('Home')] },
    ])
    expect(transformHeading(node)).toBe('h1. [Home|https://example.com]')
  })

  it('clamps depth at h6 (safety guard — remark never exceeds h6)', () => {
    expect(transformHeading(heading(6, [text('Deep')]))).toBe('h6. Deep')
  })
})
