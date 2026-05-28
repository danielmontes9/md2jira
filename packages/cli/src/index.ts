#!/usr/bin/env node
import { createRequire } from 'node:module'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createInterface } from 'node:readline'
import { Command, Option, InvalidArgumentError } from 'commander'
import { convert, convertToAdf, convertToConfluence } from 'md2jira-core'
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

/** Collector for --disable: supports both comma-separated and repeated flags. Deduplicates. */
function collectTransforms(val: string, prev: string[]): string[] {
  const next = val
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return [...new Set([...prev, ...next])]
}

const program = new Command()

program
  .name('md2jira')
  .description(
    'Convert Markdown to Jira Wiki Markup, Atlassian Document Format (ADF), or Confluence Storage Format'
  )
  .version(version)
  .argument('[input]', 'Input Markdown file (omit to read from stdin)')
  .option('-o, --output <file>', 'Output file (omit to write to stdout)')
  .addOption(
    new Option('-f, --format <format>', 'Output format: "wiki" (default), "adf", or "confluence"')
      .default('wiki')
      .argParser((v) => {
        const lower = v.toLowerCase()
        if (!['wiki', 'adf', 'confluence'].includes(lower)) {
          throw new InvalidArgumentError('Allowed choices are wiki, adf, confluence.')
        }
        return lower
      })
  )
  .option(
    '--base-url <url>',
    'Base URL prepended to relative links (e.g. https://company.atlassian.net/wiki)'
  )
  .option(
    '--disable <transforms>',
    'Transform(s) to suppress — comma-separated or repeated flag: heading,list,code,blockquote,table,thematicBreak,panel',
    collectTransforms,
    [] as string[]
  )
  .action(
    async (
      input: string | undefined,
      options: { output?: string; format: string; baseUrl?: string; disable: string[] }
    ) => {
      // Format is validated and normalised to lowercase by commander's argParser + choices.
      const fmt = options.format

      // Validate --base-url is an absolute URL.
      if (options.baseUrl !== undefined) {
        try {
          new URL(options.baseUrl)
        } catch {
          process.stderr.write(
            `Error: --base-url "${options.baseUrl}" is not a valid absolute URL\n`
          )
          process.exit(1)
        }
      }

      let markdown: string
      if (input) {
        markdown = await readFile(resolve(input), 'utf-8')
      } else {
        markdown = await readStdin()
      }

      // Validate --disable transform names.
      let disableTransforms: ConvertOptions['disableTransforms'] | undefined
      if (options.disable.length > 0) {
        const invalid = options.disable.filter((t) => !VALID_TRANSFORMS.has(t))
        if (invalid.length > 0) {
          process.stderr.write(
            `Error: unknown transform(s): ${invalid.join(', ')}\nValid values: ${[...VALID_TRANSFORMS].join(', ')}\n`
          )
          process.exit(1)
        }
        disableTransforms = options.disable as ConvertOptions['disableTransforms']
      }

      const convertOptions: ConvertOptions = {
        ...(options.baseUrl ? { baseUrl: options.baseUrl } : {}),
        ...(disableTransforms ? { disableTransforms } : {}),
      }

      let result: string
      if (fmt === 'adf') {
        result = JSON.stringify(convertToAdf(markdown, convertOptions), null, 2)
      } else if (fmt === 'confluence') {
        result = convertToConfluence(markdown, convertOptions)
      } else {
        result = convert(markdown, convertOptions)
      }

      // Ensure a trailing newline so shell prompts appear on a fresh line.
      const output = result && !result.endsWith('\n') ? result + '\n' : result
      if (options.output) {
        await writeFile(resolve(options.output), output, 'utf-8')
      } else {
        process.stdout.write(output)
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
