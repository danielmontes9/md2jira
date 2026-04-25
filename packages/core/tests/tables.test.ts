import { describe, it, expect } from 'vitest'
import { transformTable } from '../src/transforms/tables.js'
import type { Table, TableRow, TableCell, PhrasingContent } from 'mdast'

const text = (value: string): PhrasingContent => ({ type: 'text', value })

function cell(children: PhrasingContent[]): TableCell {
  return { type: 'tableCell', children }
}

function row(cells: PhrasingContent[][]): TableRow {
  return { type: 'tableRow', children: cells.map((c) => cell(c)) }
}

function table(rows: PhrasingContent[][][]): Table {
  return { type: 'table', align: [], children: rows.map(row) }
}

describe('transformTable', () => {
  it('returns empty string for an empty table', () => {
    expect(transformTable({ type: 'table', align: [], children: [] })).toBe('')
  })

  it('converts header row with || and data row with |', () => {
    const tbl = table([
      [[text('Name')], [text('Age')]],
      [[text('John')], [text('30')]],
    ])
    expect(transformTable(tbl)).toBe('||Name||Age||\n|John|30|')
  })

  it('treats single-row table as header-only', () => {
    const tbl = table([[[text('A')], [text('B')]]])
    expect(transformTable(tbl)).toBe('||A||B||')
  })

  it('normalizes unequal column count by padding with empty cells', () => {
    const tbl: Table = {
      type: 'table',
      align: [],
      children: [row([[text('A')], [text('B')], [text('C')]]), row([[text('1')], [text('2')]])],
    }
    expect(transformTable(tbl)).toBe('||A||B||C||\n|1|2||')
  })

  it('escapes curly braces { and } in cells', () => {
    const tbl = table([[[text('Formula')]], [[text('{value}')]]])
    expect(transformTable(tbl)).toBe('||Formula||\n|\\{value\\}|')
  })

  it('escapes pipe characters inside cells that are not link separators', () => {
    const tbl = table([[[text('Formula')]], [[text('a | b')]]])
    expect(transformTable(tbl)).toBe('||Formula||\n|a \\| b|')
  })

  it('does not escape the | separator inside a Jira link [text|url]', () => {
    const tbl: Table = {
      type: 'table',
      align: [],
      children: [
        row([[text('Site')]]),
        row([
          [
            {
              type: 'link',
              url: 'https://example.com',
              title: null,
              children: [text('Example')],
            } as PhrasingContent,
          ],
        ]),
      ],
    }
    expect(transformTable(tbl)).toBe('||Site||\n|[Example|https://example.com]|')
  })

  it('handles empty cells', () => {
    const tbl = table([
      [[text('A')], [text('B')]],
      [[], []],
    ])
    expect(transformTable(tbl)).toBe('||A||B||\n|||')
  })

  it('applies inline formatting inside cells', () => {
    const tbl: Table = {
      type: 'table',
      align: [],
      children: [
        row([[text('Field')], [text('Value')]]),
        row([[text('Status')], [{ type: 'strong', children: [text('High')] } as PhrasingContent]]),
      ],
    }
    expect(transformTable(tbl)).toBe('||Field||Value||\n|Status|*High*|')
  })

  it('escapes standalone brackets [text] that are not links', () => {
    const tbl = table([[[text('Note')]], [[text('[see docs]')]]])
    expect(transformTable(tbl)).toBe('||Note||\n|\\[see docs\\]|')
  })

  it('preserves {{inline code}} formatting in table cells without double-escaping', () => {
    const tbl: Table = {
      type: 'table',
      align: [],
      children: [
        row([[text('Field')]]),
        row([[{ type: 'inlineCode', value: 'myVar' } as PhrasingContent]]),
      ],
    }
    expect(transformTable(tbl)).toBe('||Field||\n|{{myVar}}|')
  })

  it('escapes lone { and } macro delimiters but not {{ }} in the same cell', () => {
    const tbl: Table = {
      type: 'table',
      align: [],
      children: [
        row([[text('A')], [text('B')]]),
        row([[text('{color:red}')], [{ type: 'inlineCode', value: 'x' } as PhrasingContent]]),
      ],
    }
    expect(transformTable(tbl)).toBe('||A||B||\n|\\{color:red\\}|{{x}}|')
  })
})
