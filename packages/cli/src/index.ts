#!/usr/bin/env node
import { createRequire } from 'node:module'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createInterface } from 'node:readline'
import { Command } from 'commander'
import { convert } from 'md2jira-core'

const require = createRequire(import.meta.url)
const { version } = require('../package.json') as { version: string }

const program = new Command()

program
  .name('md2jira')
  .description('Convert Markdown to Jira Wiki Markup')
  .version(version)
  .argument('[input]', 'Input Markdown file (omit to read from stdin)')
  .option('-o, --output <file>', 'Output file (omit to write to stdout)')
  .action(async (input: string | undefined, options: { output?: string }) => {
    let markdown: string

    if (input) {
      markdown = await readFile(resolve(input), 'utf-8')
    } else {
      markdown = await readStdin()
    }

    const result = convert(markdown)

    if (options.output) {
      await writeFile(resolve(options.output), result, 'utf-8')
    } else {
      process.stdout.write(result)
    }
  })

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
