import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { execFile } from 'node:child_process'
import { writeFile, readFile, unlink, mkdir } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CLI_PATH = resolve(__dirname, '..', 'dist', 'index.js')
const FIXTURES_DIR = resolve(__dirname, 'fixtures')

function run(
  args: string[],
  options?: { stdin?: string }
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    const child = execFile('node', [CLI_PATH, ...args], (error, stdout, stderr) => {
      resolve({
        stdout,
        stderr,
        exitCode: error?.code ? Number(error.code) : (child.exitCode ?? 0),
      })
    })
    if (options?.stdin !== undefined) {
      child.stdin?.write(options.stdin)
      child.stdin?.end()
    }
  })
}

const SAMPLE_MD = `# Hello World

This is **bold** and _italic_ text.

- Item 1
- Item 2

\`\`\`js
console.log('hello')
\`\`\`
`

const EXPECTED_JIRA = `h1. Hello World

This is *bold* and _italic_ text.

* Item 1
* Item 2

{code:language=javascript}
console.log('hello')
{code}
`

beforeAll(async () => {
  await mkdir(FIXTURES_DIR, { recursive: true })
  await writeFile(resolve(FIXTURES_DIR, 'sample.md'), SAMPLE_MD, 'utf-8')
})

afterAll(async () => {
  // Clean up all generated fixture files. Use catch(() => {}) so missing files don't fail teardown.
  const files = ['sample.md', 'output.jira', 'bom.md', 'out.jira']
  for (const f of files) {
    await unlink(resolve(FIXTURES_DIR, f)).catch(() => {})
  }
})

describe('md2jira CLI', () => {
  it('shows help with --help', async () => {
    const { stdout, exitCode } = await run(['--help'])
    expect(exitCode).toBe(0)
    expect(stdout).toContain('Convert Markdown to Jira Wiki Markup')
    expect(stdout).toContain('--output')
    expect(stdout).toContain('--base-url')
    expect(stdout).toContain('--disable')
    expect(stdout).toContain('--format')
  })

  it('shows version with --version', async () => {
    const { stdout, exitCode } = await run(['--version'])
    expect(exitCode).toBe(0)
    expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/)
  })

  it('converts a file to stdout', async () => {
    const { stdout, exitCode } = await run([resolve(FIXTURES_DIR, 'sample.md')])
    expect(exitCode).toBe(0)
    expect(stdout).toBe(EXPECTED_JIRA)
  })

  it('converts stdin to stdout', async () => {
    const { stdout, exitCode } = await run([], { stdin: SAMPLE_MD })
    expect(exitCode).toBe(0)
    expect(stdout).toBe(EXPECTED_JIRA)
  })

  it('writes output to file with -o', async () => {
    const outputPath = resolve(FIXTURES_DIR, 'output.jira')
    const { exitCode } = await run([resolve(FIXTURES_DIR, 'sample.md'), '-o', outputPath])
    expect(exitCode).toBe(0)
    const content = await readFile(outputPath, 'utf-8')
    expect(content).toBe(EXPECTED_JIRA)
  })

  it('returns error for nonexistent file', async () => {
    const { stderr, exitCode } = await run(['nonexistent-file.md'])
    expect(exitCode).toBe(1)
    expect(stderr).toContain('ENOENT')
  })

  it('converts empty input to empty output', async () => {
    const { stdout, exitCode } = await run([], { stdin: '' })
    expect(exitCode).toBe(0)
    expect(stdout).toBe('')
  })

  it('handles markdown with tables', async () => {
    const md = '| H1 | H2 |\n|---|---|\n| A | B |\n'
    const { stdout, exitCode } = await run([], { stdin: md })
    expect(exitCode).toBe(0)
    expect(stdout).toContain('||H1||H2||')
    expect(stdout).toContain('|A|B|')
  })

  it('outputs ADF JSON with --format adf', async () => {
    const md = '# Hello\n'
    const { stdout, exitCode } = await run(['--format', 'adf'], { stdin: md })
    expect(exitCode).toBe(0)
    const doc = JSON.parse(stdout)
    expect(doc).toMatchObject({
      version: 1,
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Hello' }],
        },
      ],
    })
  })

  it('defaults to wiki format when --format is omitted', async () => {
    const { stdout, exitCode } = await run([], { stdin: '# Title\n' })
    expect(exitCode).toBe(0)
    expect(stdout).toBe('h1. Title\n')
  })

  it('shows --format option in help', async () => {
    const { stdout } = await run(['--help'])
    expect(stdout).toContain('--format')
    expect(stdout).toContain('adf')
  })

  it('handles UTF-8 BOM in input file', async () => {
    const bomPath = resolve(FIXTURES_DIR, 'bom.md')
    await writeFile(bomPath, '\uFEFF# BOM Test\n', 'utf-8')
    const { stdout, exitCode } = await run([bomPath])
    expect(exitCode).toBe(0)
    expect(stdout).toBe('h1. BOM Test\n')
    await unlink(bomPath).catch(() => {})
  })

  it('converts markdown with unicode characters via stdin', async () => {
    const md = '# Héllo Wörld\n\n- café\n- naïve\n'
    const { stdout, exitCode } = await run([], { stdin: md })
    expect(exitCode).toBe(0)
    expect(stdout).toContain('h1. Héllo Wörld')
    expect(stdout).toContain('* café')
    expect(stdout).toContain('* naïve')
  })

  it('produces valid ADF with all element types', async () => {
    const md = '# Title\n\n**bold** and _italic_\n\n- item\n\n```js\ncode\n```\n'
    const { stdout, exitCode } = await run(['--format', 'adf'], { stdin: md })
    expect(exitCode).toBe(0)
    const doc = JSON.parse(stdout)
    expect(doc.type).toBe('doc')
    expect(doc.version).toBe(1)
    const types = doc.content.map((n: { type: string }) => n.type)
    expect(types).toContain('heading')
    expect(types).toContain('paragraph')
    expect(types).toContain('bulletList')
    expect(types).toContain('codeBlock')
  })

  it('handles CRLF line endings in stdin', async () => {
    const md = '# Title\r\n\r\nParagraph\r\n'
    const { stdout, exitCode } = await run([], { stdin: md })
    expect(exitCode).toBe(0)
    expect(stdout).toContain('h1. Title')
    expect(stdout).toContain('Paragraph')
  })
})

describe('--format validation', () => {
  it('exits with code 1 for unknown format', async () => {
    const { stderr, exitCode } = await run(['--format', 'xml'], { stdin: '# Title\n' })
    expect(exitCode).toBe(1)
    expect(stderr).toContain('invalid')
    expect(stderr).toContain('xml')
    expect(stderr).toContain('wiki')
    expect(stderr).toContain('adf')
    expect(stderr).toContain('confluence')
  })

  it('accepts format case-insensitively (ADF)', async () => {
    const { stdout, exitCode } = await run(['--format', 'ADF'], { stdin: '# Title\n' })
    expect(exitCode).toBe(0)
    expect(JSON.parse(stdout).type).toBe('doc')
  })
})

describe('--base-url validation', () => {
  it('exits with code 1 for a non-URL value', async () => {
    const { stderr, exitCode } = await run(['--base-url', 'not-a-url'], { stdin: '# Title\n' })
    expect(exitCode).toBe(1)
    expect(stderr).toContain('not a valid absolute URL')
    expect(stderr).toContain('not-a-url')
  })
})

describe('--base-url flag', () => {
  it('prepends base URL to relative links', async () => {
    const md = '[docs](/wiki/docs)\n'
    const { stdout, exitCode } = await run(['--base-url', 'https://company.atlassian.net'], {
      stdin: md,
    })
    expect(exitCode).toBe(0)
    expect(stdout).toContain('[docs|https://company.atlassian.net/wiki/docs]')
  })

  it('leaves absolute links unchanged when --base-url is set', async () => {
    const md = '[external](https://example.com)\n'
    const { stdout, exitCode } = await run(['--base-url', 'https://company.atlassian.net'], {
      stdin: md,
    })
    expect(exitCode).toBe(0)
    expect(stdout).toContain('[external|https://example.com]')
  })

  it('works with --format adf', async () => {
    const md = '[page](/wiki/page)\n'
    const { stdout, exitCode } = await run(
      ['--base-url', 'https://company.atlassian.net', '--format', 'adf'],
      { stdin: md }
    )
    expect(exitCode).toBe(0)
    const doc = JSON.parse(stdout)
    const json = JSON.stringify(doc)
    expect(json).toContain('https://company.atlassian.net/wiki/page')
  })
})

describe('--disable flag', () => {
  it('suppresses heading transform (heading node is dropped entirely)', async () => {
    const md = '# Title\n\nParagraph\n'
    const { stdout, exitCode } = await run(['--disable', 'heading'], { stdin: md })
    expect(exitCode).toBe(0)
    expect(stdout).not.toContain('h1.')
    expect(stdout).not.toContain('Title')
    expect(stdout).toContain('Paragraph')
  })

  it('suppresses list transform', async () => {
    const md = '- item A\n- item B\n'
    const { stdout, exitCode } = await run(['--disable', 'list'], { stdin: md })
    expect(exitCode).toBe(0)
    expect(stdout).not.toMatch(/^\* item/m)
  })

  it('suppresses multiple transforms with comma-separated values', async () => {
    const md = '# Heading\n\n- list item\n\nParagraph\n'
    const { stdout, exitCode } = await run(['--disable', 'heading,list'], { stdin: md })
    expect(exitCode).toBe(0)
    expect(stdout).not.toContain('h1.')
    expect(stdout).not.toMatch(/^\* /m)
    expect(stdout).toContain('Paragraph')
  })

  it('suppresses panel transform (GFM alert becomes plain blockquote)', async () => {
    const md = '> [!NOTE]\n> This is a note\n'
    const { stdout, exitCode } = await run(['--disable', 'panel'], { stdin: md })
    expect(exitCode).toBe(0)
    expect(stdout).not.toContain('{panel')
    expect(stdout).toContain('bq.')
  })

  it('exits with code 1 for unknown transform name', async () => {
    const md = '# Title\n'
    const { stderr, exitCode } = await run(['--disable', 'unknown-transform'], { stdin: md })
    expect(exitCode).toBe(1)
    expect(stderr).toContain('invalid')
    expect(stderr).toContain('unknown-transform')
  })

  it('supports repeated --disable flags (heading then list)', async () => {
    const md = '# Heading\n\n- list item\n\nParagraph\n'
    const { stdout, exitCode } = await run(['--disable', 'heading', '--disable', 'list'], {
      stdin: md,
    })
    expect(exitCode).toBe(0)
    expect(stdout).not.toContain('h1.')
    expect(stdout).not.toMatch(/^\* /m)
    expect(stdout).toContain('Paragraph')
  })

  it('suppresses heading in ADF output (--format adf)', async () => {
    const md = '# Title\n\nParagraph\n'
    const { stdout, exitCode } = await run(['--disable', 'heading', '--format', 'adf'], {
      stdin: md,
    })
    expect(exitCode).toBe(0)
    const doc = JSON.parse(stdout)
    const types = doc.content.map((n: { type: string }) => n.type)
    expect(types).not.toContain('heading')
    expect(types).toContain('paragraph')
  })

  it('combines --disable and --base-url together', async () => {
    const md = '# Title\n\n[page](/wiki/home)\n'
    const { stdout, exitCode } = await run(
      ['--disable', 'heading', '--base-url', 'https://company.atlassian.net'],
      { stdin: md }
    )
    expect(exitCode).toBe(0)
    expect(stdout).not.toContain('h1.')
    expect(stdout).toContain('[page|https://company.atlassian.net/wiki/home]')
  })
})

describe('-o / --output edge cases', () => {
  it('uses -f as short alias for --format', async () => {
    const { stdout, exitCode } = await run(['-f', 'adf'], { stdin: '# Title\n' })
    expect(exitCode).toBe(0)
    expect(JSON.parse(stdout).type).toBe('doc')
  })

  it('converts a file with --format from file argument', async () => {
    const { stdout, exitCode } = await run([resolve(FIXTURES_DIR, 'sample.md'), '--format', 'adf'])
    expect(exitCode).toBe(0)
    const doc = JSON.parse(stdout)
    expect(doc.type).toBe('doc')
    const types = doc.content.map((n: { type: string }) => n.type)
    expect(types).toContain('heading')
  })

  it('exits with code 1 when output directory does not exist', async () => {
    const badPath = resolve(FIXTURES_DIR, 'nonexistent-dir', 'out.jira')
    const { stderr, exitCode } = await run([resolve(FIXTURES_DIR, 'sample.md'), '-o', badPath])
    expect(exitCode).toBe(1)
    expect(stderr).toMatch(/ENOENT|no such file/i)
  })
})

describe('--format confluence', () => {
  it('outputs Confluence Storage Format XHTML for headings and paragraphs', async () => {
    const md = '# Hello\n\nWorld\n'
    const { stdout, exitCode } = await run(['--format', 'confluence'], { stdin: md })
    expect(exitCode).toBe(0)
    expect(stdout).toContain('<h1>Hello</h1>')
    expect(stdout).toContain('<p>World</p>')
  })

  it('accepts -f confluence as short alias', async () => {
    const { stdout, exitCode } = await run(['-f', 'confluence'], { stdin: '# Title\n' })
    expect(exitCode).toBe(0)
    expect(stdout).toContain('<h1>Title</h1>')
  })

  it('accepts --format CONFLUENCE case-insensitively', async () => {
    const { stdout, exitCode } = await run(['--format', 'CONFLUENCE'], { stdin: '# Hi\n' })
    expect(exitCode).toBe(0)
    expect(stdout).toContain('<h1>Hi</h1>')
  })

  it('converts inline formatting to HTML tags', async () => {
    const md = '**bold** and _italic_ and ~~strike~~\n'
    const { stdout, exitCode } = await run(['--format', 'confluence'], { stdin: md })
    expect(exitCode).toBe(0)
    expect(stdout).toContain('<strong>bold</strong>')
    expect(stdout).toContain('<em>italic</em>')
    expect(stdout).toContain('<del>strike</del>')
  })

  it('converts code blocks to ac:structured-macro', async () => {
    const md = '```js\nconsole.log("hello")\n```\n'
    const { stdout, exitCode } = await run(['--format', 'confluence'], { stdin: md })
    expect(exitCode).toBe(0)
    expect(stdout).toContain('ac:name="code"')
    expect(stdout).toContain('language')
    expect(stdout).toContain('javascript')
    expect(stdout).toContain('console.log("hello")')
  })

  it('converts lists to <ul>/<li> elements', async () => {
    const md = '- Apple\n- Banana\n'
    const { stdout, exitCode } = await run(['--format', 'confluence'], { stdin: md })
    expect(exitCode).toBe(0)
    expect(stdout).toContain('<ul>')
    expect(stdout).toContain('<li>Apple</li>')
    expect(stdout).toContain('<li>Banana</li>')
  })

  it('converts tables to XHTML table elements', async () => {
    const md = '| A | B |\n|---|---|\n| 1 | 2 |\n'
    const { stdout, exitCode } = await run(['--format', 'confluence'], { stdin: md })
    expect(exitCode).toBe(0)
    expect(stdout).toContain('<table>')
    expect(stdout).toContain('<th>A</th>')
    expect(stdout).toContain('<th>B</th>')
    expect(stdout).toContain('<td>1</td>')
  })

  it('converts GFM NOTE alert to Confluence note macro', async () => {
    const md = '> [!NOTE]\n> Note content\n'
    const { stdout, exitCode } = await run(['--format', 'confluence'], { stdin: md })
    expect(exitCode).toBe(0)
    expect(stdout).toContain('ac:name="note"')
    expect(stdout).toContain('Note content')
  })

  it('converts GFM WARNING alert to Confluence warning macro', async () => {
    const md = '> [!WARNING]\n> Careful here\n'
    const { stdout, exitCode } = await run(['--format', 'confluence'], { stdin: md })
    expect(exitCode).toBe(0)
    expect(stdout).toContain('ac:name="warning"')
  })

  it('returns empty output for empty input', async () => {
    const { stdout, exitCode } = await run(['--format', 'confluence'], { stdin: '' })
    expect(exitCode).toBe(0)
    expect(stdout).toBe('')
  })

  it('works with --base-url for relative links', async () => {
    const md = '[page](/wiki/page)\n'
    const { stdout, exitCode } = await run(
      ['--format', 'confluence', '--base-url', 'https://company.atlassian.net'],
      { stdin: md }
    )
    expect(exitCode).toBe(0)
    expect(stdout).toContain('https://company.atlassian.net/wiki/page')
  })

  it('suppresses panel transform with --disable panel, rendering plain <blockquote>', async () => {
    const md = '> [!NOTE]\n> Note content\n'
    const { stdout, exitCode } = await run(['--format', 'confluence', '--disable', 'panel'], {
      stdin: md,
    })
    expect(exitCode).toBe(0)
    expect(stdout).not.toContain('ac:name="note"')
    expect(stdout).toContain('<blockquote>')
  })
})

describe('--disable deduplication', () => {
  it('deduplicates repeated transform names (comma-separated)', async () => {
    // heading,heading should behave the same as heading — no error, no crash
    const md = '# Title\n\nParagraph\n'
    const { stdout, exitCode } = await run(['--disable', 'heading,heading'], { stdin: md })
    expect(exitCode).toBe(0)
    expect(stdout).not.toContain('h1.')
    expect(stdout).toContain('Paragraph')
  })

  it('deduplicates repeated transform names (repeated flag)', async () => {
    const md = '# Title\n\nParagraph\n'
    const { stdout, exitCode } = await run(['--disable', 'heading', '--disable', 'heading'], {
      stdin: md,
    })
    expect(exitCode).toBe(0)
    expect(stdout).not.toContain('h1.')
    expect(stdout).toContain('Paragraph')
  })
})

describe('--base-url edge cases', () => {
  it('handles trailing slash in --base-url without double slash', async () => {
    const md = '[page](/wiki/home)\n'
    const { stdout, exitCode } = await run(['--base-url', 'https://company.atlassian.net/'], {
      stdin: md,
    })
    expect(exitCode).toBe(0)
    // Trailing slash is stripped before concat: .../net/ → .../net + /wiki/home → no double slash
    expect(stdout).toContain('[page|https://company.atlassian.net/wiki/home]')
    expect(stdout).not.toContain('//wiki')
  })

  it('handles base URL without path component', async () => {
    const md = '[page](/wiki/home)\n'
    const { stdout, exitCode } = await run(['--base-url', 'https://company.atlassian.net'], {
      stdin: md,
    })
    expect(exitCode).toBe(0)
    expect(stdout).toContain('[page|https://company.atlassian.net/wiki/home]')
  })
})

describe('--watch flag', () => {
  it('exits with error when --watch is used without an input file', async () => {
    const { stderr, exitCode } = await run(['--watch'], { stdin: '# Hello\n' })
    expect(exitCode).toBe(1)
    expect(stderr).toContain('--watch requires an input file')
  })

  it('-w short flag also exits with error when no input file is given', async () => {
    const { stderr, exitCode } = await run(['-w'], { stdin: '# Hello\n' })
    expect(exitCode).toBe(1)
    expect(stderr).toContain('--watch requires an input file')
  })

  it('exits cleanly with "File not found" message when input file does not exist (no watch)', async () => {
    const { stderr, exitCode } = await run(['nonexistent-watch-file.md'])
    expect(exitCode).toBe(1)
    expect(stderr).toMatch(/ENOENT|no such file/i)
  })
})

describe('--quiet flag', () => {
  it('shows --quiet in help output', async () => {
    const { stdout } = await run(['--help'])
    expect(stdout).toContain('--quiet')
  })

  it('-q is accepted as short alias for --quiet', async () => {
    const { stdout, exitCode } = await run(['-q'], { stdin: '# Hello\n' })
    expect(exitCode).toBe(0)
    expect(stdout).toContain('h1. Hello')
  })

  it('still converts correctly when --quiet is passed', async () => {
    const { stdout, exitCode } = await run(['--quiet'], { stdin: '**bold**\n' })
    expect(exitCode).toBe(0)
    expect(stdout).toContain('*bold*')
  })
})
