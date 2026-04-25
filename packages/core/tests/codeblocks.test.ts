import { describe, it, expect } from 'vitest'
import { transformCodeBlock } from '../src/transforms/codeblocks.js'
import type { Code } from 'mdast'

const codeNode = (lang: string | null, value: string): Code => ({
  type: 'code',
  lang,
  meta: null,
  value,
})

describe('transformCodeBlock', () => {
  it('converts code block with language', () => {
    expect(transformCodeBlock(codeNode('js', 'console.log("hi")'))).toBe(
      '{code:language=js}\nconsole.log("hi")\n{code}'
    )
  })

  it('converts code block without language', () => {
    expect(transformCodeBlock(codeNode(null, 'some code'))).toBe('{code}\nsome code\n{code}')
  })

  it('preserves multi-line content exactly', () => {
    const val = 'function foo() {\n  return 1\n}'
    expect(transformCodeBlock(codeNode('js', val))).toBe(`{code:language=js}\n${val}\n{code}`)
  })

  it('handles an empty code block body', () => {
    expect(transformCodeBlock(codeNode(null, ''))).toBe('{code}\n\n{code}')
  })

  it('handles python language', () => {
    expect(transformCodeBlock(codeNode('python', 'print("hi")'))).toBe(
      '{code:language=python}\nprint("hi")\n{code}'
    )
  })

  it('handles bash language', () => {
    expect(transformCodeBlock(codeNode('bash', 'echo hello'))).toBe(
      '{code:language=bash}\necho hello\n{code}'
    )
  })

  it('treats empty-string lang the same as null (falsy — no language attribute)', () => {
    // remark-parse never emits empty-string lang, but '' is falsy in JS so the
    // transform falls to the no-language branch: {code} without language=.
    expect(transformCodeBlock(codeNode('', 'code'))).toBe('{code}\ncode\n{code}')
  })
})
