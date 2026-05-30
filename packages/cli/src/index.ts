#!/usr/bin/env node
import { createRequire } from 'node:module'
import { readFile, writeFile, watch } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createInterface } from 'node:readline'
import { Command, Option, InvalidArgumentError } from 'commander'
import { convert, convertToAdf, convertToConfluence } from 'md2jira-core'
import type { ConvertOptions } from 'md2jira-core'

const require = createRequire(import.meta.url)
const { version } = require('../package.json') as { version: string }

const VALID_TRANSFORMS = new Set([
  'heading',
  'list',
  'code',
  'blockquote',
  'table',
  'thematicBreak',
  'panel',
])

/**
 * Collector for --disable: validates, expands comma-separated values, and
 * deduplicates. Throwing InvalidArgumentError here causes commander to report
 * the error and exit before any stdin/file I/O takes place.
 */
function collectTransforms(val: string, prev: string[]): string[] {
  const parts = val
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  for (const part of parts) {
    if (!VALID_TRANSFORMS.has(part)) {
      throw new InvalidArgumentError(
        `Unknown transform "${part}". Allowed: ${[...VALID_TRANSFORMS].join(', ')}.`
      )
    }
  }
  return [...new Set([...prev, ...parts])]
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
  .addOption(
    new Option(
      '--base-url <url>',
      'Base URL prepended to relative links (e.g. https://company.atlassian.net/wiki)'
    ).argParser((v) => {
      try {
        new URL(v)
      } catch {
        throw new InvalidArgumentError(`"${v}" is not a valid absolute URL.`)
      }
      return v
    })
  )
  .option(
    '--disable <transforms>',
    'Transform(s) to suppress — comma-separated or repeated flag: heading,list,code,blockquote,table,thematicBreak,panel',
    collectTransforms,
    [] as string[]
  )
  .option(
    '-w, --watch',
    'Re-run conversion whenever the input file changes (requires an input file)'
  )
  .option('-q, --quiet', 'Suppress informational messages written to stderr (watch mode banners)')
  .action(
    async (
      input: string | undefined,
      options: {
        output?: string
        format: string
        baseUrl?: string
        disable: string[]
        watch?: boolean
        quiet?: boolean
      }
    ) => {
      // format and baseUrl are validated and normalised at parse time by argParser.
      const fmt = options.format
      const watchMode = options.watch === true
      const quiet = options.quiet === true

      const log = (msg: string): void => {
        if (!quiet) process.stderr.write(msg)
      }

      if (watchMode && !input) {
        process.stderr.write(
          'Error: --watch requires an input file. Pipe mode is not supported in watch mode.\n'
        )
        process.exit(1)
      }

      // --disable values are validated at parse time by collectTransforms;
      // by the time we reach here they are guaranteed to be valid.
      const disableTransforms: ConvertOptions['disableTransforms'] | undefined =
        options.disable.length > 0
          ? (options.disable as ConvertOptions['disableTransforms'])
          : undefined

      const convertOptions: ConvertOptions = {
        ...(options.baseUrl ? { baseUrl: options.baseUrl } : {}),
        ...(disableTransforms ? { disableTransforms } : {}),
      }

      /** Reads the input, converts, and writes output once. */
      async function runOnce(): Promise<void> {
        let markdown: string
        try {
          markdown = input ? await readFile(resolve(input), 'utf-8') : await readStdin()
        } catch (err) {
          if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
            process.stderr.write(`ENOENT: no such file or directory, open '${input}'\n`)
            process.exit(1)
          }
          throw err
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
        const out = result && !result.endsWith('\n') ? result + '\n' : result
        if (options.output) {
          await writeFile(resolve(options.output), out, 'utf-8')
        } else {
          process.stdout.write(out)
        }
      }

      await runOnce()

      if (!watchMode) return

      const ac = new AbortController()
      process.on('SIGINT', () => {
        ac.abort()
        log('\n[md2jira] Watch stopped.\n')
        process.exit(0)
      })

      log(`[md2jira] Watching ${input}...\n`)

      try {
        for await (const { eventType } of watch(resolve(input!), { signal: ac.signal })) {
          if (eventType === 'change') {
            log('[md2jira] Change detected, converting...\n')
            await runOnce()
          }
        }
      } catch (err) {
        const e = err as NodeJS.ErrnoException
        // AbortError is expected when SIGINT triggers ac.abort()
        if (e.name === 'AbortError') return
        // File deleted while watching — report and exit cleanly
        if (e.code === 'ENOENT') {
          process.stderr.write(`[md2jira] Watched file was deleted: ${input}\n`)
          process.exit(1)
        }
        throw err
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
