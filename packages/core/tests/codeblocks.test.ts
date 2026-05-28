import { describe, it, expect } from 'vitest'
import { transformCodeBlock, resolveLanguage } from '../src/transforms/codeblocks.js'
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
      '{code:language=javascript}\nconsole.log("hi")\n{code}'
    )
  })

  it('converts code block without language', () => {
    expect(transformCodeBlock(codeNode(null, 'some code'))).toBe('{code}\nsome code\n{code}')
  })

  it('preserves multi-line content exactly', () => {
    const val = 'function foo() {\n  return 1\n}'
    expect(transformCodeBlock(codeNode('js', val))).toBe(
      `{code:language=javascript}\n${val}\n{code}`
    )
  })

  it('handles an empty code block body', () => {
    expect(transformCodeBlock(codeNode(null, ''))).toBe('{code}\n\n{code}')
  })

  it('handles python language (no alias — passes through)', () => {
    expect(transformCodeBlock(codeNode('python', 'print("hi")'))).toBe(
      '{code:language=python}\nprint("hi")\n{code}'
    )
  })

  it('handles bash language (no alias — passes through)', () => {
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

describe('resolveLanguage', () => {
  it('maps js → javascript', () => expect(resolveLanguage('js')).toBe('javascript'))
  it('maps ts → typescript', () => expect(resolveLanguage('ts')).toBe('typescript'))
  it('maps py → python', () => expect(resolveLanguage('py')).toBe('python'))
  it('maps rb → ruby', () => expect(resolveLanguage('rb')).toBe('ruby'))
  it('maps sh → bash', () => expect(resolveLanguage('sh')).toBe('bash'))
  it('maps shell → bash', () => expect(resolveLanguage('shell')).toBe('bash'))
  it('maps zsh → bash', () => expect(resolveLanguage('zsh')).toBe('bash'))
  it('maps yml → yaml', () => expect(resolveLanguage('yml')).toBe('yaml'))
  it('maps md → none', () => expect(resolveLanguage('md')).toBe('none'))
  it('maps txt → none', () => expect(resolveLanguage('txt')).toBe('none'))
  it('maps plaintext → none', () => expect(resolveLanguage('plaintext')).toBe('none'))
  it('is case-insensitive — JS → javascript', () =>
    expect(resolveLanguage('JS')).toBe('javascript'))
  it('passes through unknown languages unchanged', () =>
    expect(resolveLanguage('cobol')).toBe('cobol'))
  it('passes through canonical names unchanged (python)', () =>
    expect(resolveLanguage('python')).toBe('python'))
})
