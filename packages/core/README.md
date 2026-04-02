# md2jira-core

> Pure TypeScript library to convert Markdown to Jira Wiki Markup.

[![npm version](https://img.shields.io/npm/v/md2jira-core)](https://www.npmjs.com/package/md2jira-core)
[![npm downloads](https://img.shields.io/npm/dm/md2jira-core)](https://www.npmjs.com/package/md2jira-core)
[![license](https://img.shields.io/npm/l/md2jira-core)](https://github.com/danielmontes9/md2jira-previewer/blob/main/LICENSE)

Zero browser/React dependencies — works in Node.js, Deno, Bun, CLI tools, and VS Code extensions.

## Install

```bash
npm install md2jira-core
# or
pnpm add md2jira-core
# or
yarn add md2jira-core
```

## Usage

```ts
import { convert } from 'md2jira-core'

const jira = convert(`
# Hello World

**Bold**, _italic_, and ~~strikethrough~~.

- Item one
- Item two

\`\`\`js
console.log('hello');
\`\`\`
`)

console.log(jira)
```

**Output:**

```
h1. Hello World

*Bold*, _italic_, and -strikethrough-.

* Item one
* Item two

{code:language=js}
console.log('hello');
{code}
```

## Supported Conversions

| Markdown                | Jira Wiki Markup                  |
| ----------------------- | --------------------------------- |
| `# Heading 1`           | `h1. Heading 1`                   |
| `**bold**`              | `*bold*`                          |
| `_italic_`              | `_italic_`                        |
| `~~strike~~`            | `-strike-`                        |
| `` `inline code` ``     | `{{inline code}}`                 |
| `\`\`\`lang ... \`\`\`` | `{code:language=lang} ... {code}` |
| `- item`                | `* item`                          |
| `1. item`               | `# item`                          |
| `[text](url)`           | `[text\|url]`                     |
| `> quote`               | `bq. quote`                       |
| `---`                   | `----`                            |
| Tables                  | `\|\| header \|\|` / `\| cell \|` |

## API

### `convert(markdown: string): string`

Converts a Markdown string to Jira Wiki Markup.

```ts
import { convert } from 'md2jira-core'

const result = convert('**hello**') // → '*hello*'
```

## Live Demo

Try it in the browser: [md2jira-previewer](https://github.com/danielmontes9/md2jira-previewer)

## License

MIT © [danielmontes9](https://github.com/danielmontes9)
