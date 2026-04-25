import { describe, it, expect } from 'vitest'
import { transformList } from '../src/transforms/lists.js'
import type { List, ListItem, PhrasingContent } from 'mdast'

const text = (value: string): PhrasingContent => ({ type: 'text', value })

function para(t: string) {
  return { type: 'paragraph' as const, children: [text(t)] }
}

function listItem(t: string, checked: boolean | null = null, nested?: List): ListItem {
  const children: ListItem['children'] = [para(t)]
  if (nested) children.push(nested)
  return { type: 'listItem', checked, spread: false, children }
}

function unordered(items: ListItem[]): List {
  return { type: 'list', ordered: false, start: null, spread: false, children: items }
}

function ordered(items: ListItem[]): List {
  return { type: 'list', ordered: true, start: 1, spread: false, children: items }
}

describe('transformList', () => {
  it('converts unordered list', () => {
    const list = unordered([listItem('Item 1'), listItem('Item 2')])
    expect(transformList(list)).toBe('* Item 1\n* Item 2')
  })

  it('converts ordered list', () => {
    const list = ordered([listItem('First'), listItem('Second')])
    expect(transformList(list)).toBe('# First\n# Second')
  })

  it('converts nested unordered list', () => {
    const nested = unordered([listItem('Child')])
    const list = unordered([listItem('Parent', null, nested)])
    expect(transformList(list)).toBe('* Parent\n** Child')
  })

  it('converts deeply nested list (3 levels)', () => {
    const level3 = unordered([listItem('Deep')])
    const level2 = unordered([listItem('Mid', null, level3)])
    const list = unordered([listItem('Top', null, level2)])
    expect(transformList(list)).toBe('* Top\n** Mid\n*** Deep')
  })

  it('converts nested ordered list', () => {
    const nested = ordered([listItem('Sub first')])
    const list = ordered([listItem('First', null, nested)])
    expect(transformList(list)).toBe('# First\n## Sub first')
  })

  it('converts mixed nested (unordered inside ordered)', () => {
    const nested = unordered([listItem('Sub bullet')])
    const list = ordered([listItem('First', null, nested)])
    expect(transformList(list)).toBe('# First\n#* Sub bullet')
  })

  it('converts task list — checked item uses (/) icon', () => {
    const list = unordered([listItem('Done', true)])
    expect(transformList(list)).toBe('(/) Done')
  })

  it('converts task list — unchecked item uses (x) icon', () => {
    const list = unordered([listItem('Todo', false)])
    expect(transformList(list)).toBe('(x) Todo')
  })

  it('converts mixed checked/unchecked task list', () => {
    const list = unordered([listItem('Done', true), listItem('Pending', false)])
    expect(transformList(list)).toBe('(/) Done\n(x) Pending')
  })

  it('handles list item with inline formatting', () => {
    const item: ListItem = {
      type: 'listItem',
      checked: null,
      spread: false,
      children: [
        {
          type: 'paragraph',
          children: [{ type: 'strong', children: [text('Bold')] }, text(' item')],
        },
      ],
    }
    const list = unordered([item])
    expect(transformList(list)).toBe('* *Bold* item')
  })
})
