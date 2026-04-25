#!/usr/bin/env node
import { createRequire } from 'node:module'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createInterface } from 'node:readline'
import { Command } from 'commander'
import { convert, convertToAdf } from 'md2jira-core'
import type { ConvertOptions } from 'md2jira-core'

const require = createRequire(import.meta.url)
const { version } = require('../package.json') as { version: string }

/** Valid transform names accepted by --disable. */
const VALID_TRANSFORMS = new Set([
  'heading',
  'list',
  'code',
  'blockquote',
  'table',
  'thematicBreak',
  'panel',
])

const program = new Command()

program
  .name('md2jira')
  .description('Convert Markdown to Jira Wiki Markup or Atlassian Document Format (ADF)')
  .version(version)
  .argument('[input]', 'Input Markdown file (omit to read from stdin)')
  .option('-o, --output <file>', 'Output file (omit to write to stdout)')
  .option('-f, --format <format>', 'Output format: "wiki" (default) or "adf"', 'wiki')
  .option(
    '--base-url <url>',
    'Base URL prepended to relative links (e.g. https://company.atlassian.net/wiki)'
  )
  .option(
    '--disable <transforms>',
    'Comma-separated list of transforms to suppress: heading,list,code,blockquote,table,thematicBreak,panel'
  )
  .action(
    async (
      input: string | undefined,
      options: { output?: string; format?: string; baseUrl?: string; disable?: string }
    ) => {
      let markdown: string

      if (input) {
        markdown = await readFile(resolve(input), 'utf-8')
      } else {
        markdown = await readStdin()
      }

      // Build ConvertOptions from CLI flags.
      let disableTransforms: ConvertOptions['disableTransforms'] | undefined
      if (options.disable) {
        const requested = options.disable.split(',').map((s) => s.trim())
        const invalid = requested.filter((t) => !VALID_TRANSFORMS.has(t))
        if (invalid.length > 0) {
          process.stderr.write(
            `Error: unknown transform(s): ${invalid.join(', ')}\nValid values: ${[...VALID_TRANSFORMS].join(', ')}\n`
          )
          process.exit(1)
        }
        disableTransforms = requested as ConvertOptions['disableTransforms']
      }

      const convertOptions: ConvertOptions = {
        ...(options.baseUrl ? { baseUrl: options.baseUrl } : {}),
        ...(disableTransforms ? { disableTransforms } : {}),
      }

      const fmt = options.format?.toLowerCase()
      let result: string
      if (fmt === 'adf') {
        result = JSON.stringify(convertToAdf(markdown, convertOptions), null, 2)
      } else {
        result = convert(markdown, convertOptions)
      }

      if (options.output) {
        await writeFile(resolve(options.output), result, 'utf-8')
      } else {
        process.stdout.write(result)
      }
    }
  )

program.parseAsync(process.argv).catch((err: unknown) => {
  process.stderr.write(`Error: ${String(err instanceof Error ? err.message : err)}\n`)
  process.exit(1)
})

function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (process.stdin.isTTY) {
      reject(
        new Error('No input file provided and stdin is a TTY. Provide a file path or pipe content.')
      )
      return
    }
    const rl = createInterface({ input: process.stdin })
    const lines: string[] = []
    rl.on('line', (line) => lines.push(line))
    rl.on('close', () => resolve(lines.join('\n')))
    rl.on('error', reject)
  })
}
