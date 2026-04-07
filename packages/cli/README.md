# md2jira-cli

Convert Markdown to Jira Wiki Markup from the command line.

## Install

```bash
# Global install
npm install -g md2jira-cli

# No install needed
npx md2jira-cli input.md
```

## Usage

**File to stdout**

```bash
md2jira input.md
```

**File to file**

```bash
md2jira input.md -o output.txt
```

**Pipe from stdin**

```bash
# macOS / Linux
cat input.md | md2jira

# Windows (PowerShell)
Get-Content input.md | md2jira
```

## Example

Given `ticket.md`:

```markdown
# Bug: login fails on Safari

**Steps to reproduce:**

1. Open Safari
2. Go to `/login`
3. Submit the form

`console.error` shows a CORS error.

| Browser | Status   |
| ------- | -------- |
| Chrome  | ✅ Works |
| Safari  | ❌ Fails |
```

Running `md2jira ticket.md` outputs:

```
h1. Bug: login fails on Safari

*Steps to reproduce:*

# Open Safari
# Go to /login
# Submit the form

{{console.error}} shows a CORS error.

|| Browser || Status ||
| Chrome | ✅ Works |
| Safari | ❌ Fails |
```

## Options

| Argument / Option     | Description                                   |
| --------------------- | --------------------------------------------- |
| `[input]`             | Input Markdown file. Omit to read from stdin. |
| `-o, --output <file>` | Write output to a file instead of stdout.     |
| `-V, --version`       | Print version number.                         |
| `-h, --help`          | Display help.                                 |

## Related

- [md2jira-core](https://www.npmjs.com/package/md2jira-core) — the underlying conversion library (use in Node.js / Deno / Bun)
- [Live Demo](https://danielmontes9.github.io/md2jira) — browser app

## Support the Project

If you find this tool useful, consider buying me a coffee :)

<a href="https://www.buymeacoffee.com/danielmontes9" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="50" ></a>

## License

MIT
