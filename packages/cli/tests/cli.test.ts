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

{code:language=js}
console.log('hello')
{code}`

beforeAll(async () => {
  await mkdir(FIXTURES_DIR, { recursive: true })
  await writeFile(resolve(FIXTURES_DIR, 'sample.md'), SAMPLE_MD, 'utf-8')
})

afterAll(async () => {
  const files = ['sample.md', 'output.jira']
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
    expect(stdout).toBe('h1. Title')
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
    expect(stdout).toBe('h1. BOM Test')
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
    expect(stderr).toContain('unknown format')
    expect(stderr).toContain('xml')
    expect(stderr).toContain('wiki')
    expect(stderr).toContain('adf')
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
    expect(stderr).toContain('unknown transform')
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
})
