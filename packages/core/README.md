# md2jira-core

> Pure TypeScript library to convert Markdown to Jira Wiki Markup.

[![npm version](https://img.shields.io/npm/v/md2jira-core)](https://www.npmjs.com/package/md2jira-core)
[![npm downloads](https://img.shields.io/npm/dm/md2jira-core)](https://www.npmjs.com/package/md2jira-core)
[![license](https://img.shields.io/npm/l/md2jira-core)](https://github.com/danielmontes9/md2jira/blob/main/LICENSE)

Zero browser/React dependencies — works in Node.js, Deno, Bun, CLI tools, and VS Code extensions.

![md2jira — live two-panel converter: paste Markdown on the left, get an instant Jira-ready preview on the right](https://raw.githubusercontent.com/danielmontes9/md2jira/main/.github/assets/md2jira-previewer-before-after-core.png)

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

Try it in the browser: [md2jira-previewer](https://github.com/danielmontes9/md2jira)

## Support the Project

If you find this tool useful, consider buying me a coffee :)

<a href="https://www.buymeacoffee.com/danielmontes9" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="50" ></a>

## License

MIT © [danielmontes9](https://github.com/danielmontes9)
