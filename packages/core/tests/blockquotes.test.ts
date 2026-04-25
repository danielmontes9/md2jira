import { describe, it, expect } from 'vitest'
import {
  transformBlockquote,
  detectAlertType,
  transformPanel,
} from '../src/transforms/blockquotes.js'
import { convert } from '../src/index.js'
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
    const node = bq([para([{ type: 'strong', children: [text('bold')] }, text(' quote')])])
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

describe('detectAlertType', () => {
  it('returns NOTE for [!NOTE] marker', () => {
    expect(detectAlertType(bq([para([text('[!NOTE]')])]))).toBe('NOTE')
  })

  it('returns TIP for [!TIP] marker', () => {
    expect(detectAlertType(bq([para([text('[!TIP]')])]))).toBe('TIP')
  })

  it('returns WARNING for [!WARNING] marker', () => {
    expect(detectAlertType(bq([para([text('[!WARNING]')])]))).toBe('WARNING')
  })

  it('returns CAUTION for [!CAUTION] marker', () => {
    expect(detectAlertType(bq([para([text('[!CAUTION]')])]))).toBe('CAUTION')
  })

  it('returns IMPORTANT for [!IMPORTANT] marker', () => {
    expect(detectAlertType(bq([para([text('[!IMPORTANT]')])]))).toBe('IMPORTANT')
  })

  it('is case-insensitive — [!note] → NOTE', () => {
    expect(detectAlertType(bq([para([text('[!note]')])]))).toBe('NOTE')
  })

  it('detects marker in a soft-wrapped text node [!NOTE]\\ncontent', () => {
    expect(detectAlertType(bq([para([text('[!NOTE]\nsome content')])]))).toBe('NOTE')
  })

  it('returns null for a regular blockquote', () => {
    expect(detectAlertType(bq([para([text('Just a regular quote')])]))).toBeNull()
  })

  it('returns null for an empty blockquote', () => {
    expect(detectAlertType(bq([]))).toBeNull()
  })
})

describe('transformPanel — wiki markup', () => {
  it('converts [!NOTE] to {note} macro', () => {
    const node = bq([para([text('[!NOTE]\nSome info')])])
    expect(transformPanel(node, 'NOTE')).toBe('{note}\nSome info\n{note}')
  })

  it('converts [!TIP] to {tip} macro', () => {
    const node = bq([para([text('[!TIP]\nA useful tip')])])
    expect(transformPanel(node, 'TIP')).toBe('{tip}\nA useful tip\n{tip}')
  })

  it('converts [!WARNING] to {warning} macro', () => {
    const node = bq([para([text('[!WARNING]\nBe careful')])])
    expect(transformPanel(node, 'WARNING')).toBe('{warning}\nBe careful\n{warning}')
  })

  it('maps [!CAUTION] to {warning} (no {caution} in Jira)', () => {
    const node = bq([para([text('[!CAUTION]\nDanger zone')])])
    expect(transformPanel(node, 'CAUTION')).toBe('{warning}\nDanger zone\n{warning}')
  })

  it('maps [!IMPORTANT] to {info}', () => {
    const node = bq([para([text('[!IMPORTANT]\nKey information')])])
    expect(transformPanel(node, 'IMPORTANT')).toBe('{info}\nKey information\n{info}')
  })

  it('strips standalone marker paragraph when blank-line separated from body', () => {
    const node = bq([para([text('[!NOTE]')]), para([text('Body text')])])
    expect(transformPanel(node, 'NOTE')).toBe('{note}\nBody text\n{note}')
  })

  it('preserves inline formatting in panel body', () => {
    const node = bq([para([text('[!NOTE]\n'), { type: 'strong', children: [text('bold')] }])])
    expect(transformPanel(node, 'NOTE')).toBe('{note}\n*bold*\n{note}')
  })

  it('renders code block inside panel body', () => {
    const code = { type: 'code' as const, lang: 'js', meta: null, value: 'const x = 1' }
    const node = bq([para([text('[!NOTE]')]), code])
    expect(transformPanel(node, 'NOTE')).toBe(
      '{note}\n{code:language=js}\nconst x = 1\n{code}\n{note}'
    )
  })

  it('renders list inside panel body', () => {
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
          children: [para([text('item one')])],
        },
        {
          type: 'listItem' as const,
          checked: null,
          spread: false,
          children: [para([text('item two')])],
        },
      ],
    }
    const node = bq([para([text('[!NOTE]')]), list])
    expect(transformPanel(node, 'NOTE')).toBe('{note}\n* item one\n* item two\n{note}')
  })

  it('renders both list and code block inside a multi-block panel', () => {
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
          children: [para([text('step')])],
        },
      ],
    }
    const code = { type: 'code' as const, lang: null, meta: null, value: 'npm install' }
    const node = bq([para([text('[!TIP]')]), list, code])
    expect(transformPanel(node, 'TIP')).toBe('{tip}\n* step\n\n{code}\nnpm install\n{code}\n{tip}')
  })

  it('converts empty panel body (only marker) to empty macro block', () => {
    const node = bq([para([text('[!NOTE]')])])
    expect(transformPanel(node, 'NOTE')).toBe('{note}\n\n{note}')
  })

  it('silently ignores a nested blockquote inside a panel body — no output, no crash', () => {
    // Jira Wiki has no nested blockquote syntax inside a panel macro.
    // The nested bq. must be dropped rather than emitted as malformed markup.
    // text('[!NOTE] main content') mirrors how remark soft-wraps marker + body in one text node.
    const nestedBq = bq([para([text('nested quote')])])
    const node = bq([para([text('[!NOTE] main content')]), nestedBq])
    const result = transformPanel(node, 'NOTE')
    expect(result).toBe('{note}\nmain content\n{note}')
    expect(result).not.toContain('bq.')
    expect(result).not.toContain('nested quote')
  })
})

describe('convert — GFM Alert panels (integration)', () => {
  it('converts [!NOTE] alert to {note} panel', () => {
    expect(convert('> [!NOTE]\n> Some info')).toBe('{note}\nSome info\n{note}')
  })

  it('converts [!TIP] alert to {tip} panel', () => {
    expect(convert('> [!TIP]\n> A useful tip')).toBe('{tip}\nA useful tip\n{tip}')
  })

  it('converts [!WARNING] alert to {warning} panel', () => {
    expect(convert('> [!WARNING]\n> Be careful')).toBe('{warning}\nBe careful\n{warning}')
  })

  it('converts [!CAUTION] alert to {warning} panel', () => {
    expect(convert('> [!CAUTION]\n> Danger zone')).toBe('{warning}\nDanger zone\n{warning}')
  })

  it('converts [!IMPORTANT] alert to {info} panel', () => {
    expect(convert('> [!IMPORTANT]\n> Key information')).toBe('{info}\nKey information\n{info}')
  })

  it('leaves regular blockquotes as bq. (no regression)', () => {
    expect(convert('> Just a regular quote')).toBe('bq. Just a regular quote')
  })

  it('silently drops nested blockquote inside GFM Alert panel — no bq. in output', () => {
    // GitHub renders nested blockquotes inside alerts, but Jira Wiki has no equivalent.
    // The inner blockquote must be dropped entirely rather than leaking as malformed bq. markup.
    const result = convert('> [!NOTE]\n> content\n>\n> > nested quote')
    expect(result).toContain('{note}')
    expect(result).toContain('content')
    expect(result).not.toContain('bq.')
  })
})
