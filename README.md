<div align="center">

# md2jira-previewer

**Convert Markdown to Jira Wiki Markup  instantly, in your browser.**

[![Build Status](https://img.shields.io/github/actions/workflow/status/danielmontes9/md2jira-previewer/ci.yml?branch=main&style=flat-square)](https://github.com/danielmontes9/md2jira-previewer/actions)
[![npm version](https://img.shields.io/npm/v/@md2jira-previewer/core?style=flat-square)](https://www.npmjs.com/package/@md2jira-previewer/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg?style=flat-square)](https://conventionalcommits.org)

[**Live Demo**](https://danielmontes9.github.io/md2jira-previewer) &nbsp;·&nbsp; [Report Bug](https://github.com/danielmontes9/md2jira-previewer/issues/new?template=bug_report.md) &nbsp;·&nbsp; [Request Feature](https://github.com/danielmontes9/md2jira-previewer/issues/new?template=feature_request.md)

</div>

---

## What is md2jira-previewer?

md2jira-previewer is an open-source tool that converts **Markdown** into **Jira Wiki Markup**  the format Jira uses natively for issue descriptions, comments, and wiki pages.

Paste your Markdown on the left, get Jira-ready markup on the right. No backend, no accounts, no data sent anywhere.

```
# Title                      h1. Title
**bold**                     *bold*
`code`                       {{code}}
| Col1 | Col2 |              || Col1 || Col2 ||
| val1 | val2 |              | val1 | val2 |
```

---

## Features

- **Headers** (h1h6, overflow normalized to h6)
- **Text formatting**: bold, italic, strikethrough, inline code
- **Lists**: unordered and ordered, with nested levels
- **Links**: `[text](url)`  `[text|url]`
- **Code blocks** with language detection
- **Blockquotes**
- **Horizontal rules**
- **Tables** (core feature): headers, multiline cells, inline formatting inside cells, column normalization, escape characters

---

## Usage

### Web App

Go to [danielmontes9.github.io/md2jira-previewer](https://danielmontes9.github.io/md2jira-previewer) — paste your Markdown, copy the output.

### JavaScript / TypeScript

```ts
import { convert } from '@md2jira-previewer/core'

const jira = convert(`
# My Issue

| Field | Value |
|-------|-------|
| Status | In Progress |
| Priority | **High** |
`)

console.log(jira)
// h1. My Issue
//
// || Field || Value ||
// | Status | In Progress |
// | Priority | *High* |
```

### CLI (coming soon)

```bash
npx md2jira-previewer input.md
npx md2jira-previewer input.md -o output.txt
echo "# Title" | npx md2jira-previewer
```

---

## Installation

### Core package

```bash
npm install @md2jira-previewer/core
# or
pnpm add @md2jira-previewer/core
```

### Run the web app locally

```bash
# Requires pnpm and Node.js >= 18
git clone https://github.com/danielmontes9/md2jira-previewer.git
cd md2jira-previewer
pnpm install
pnpm --filter web dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Architecture

md2jira-previewer is structured as a **pnpm monorepo** with a strict separation between the conversion engine and the UI:

```
packages/core    Pure TypeScript, no browser deps. Usable in Node, browser, VSCode.
apps/web         React 18 + Vite + Magic UI. Imports @md2jira-previewer/core.
```

The core uses a `Markdown  AST (remark)  Transform  Jira string` pipeline. This design allows the same engine to power the web app, CLI, and a future VSCode extension.

---

## Roadmap

- [x] Web App with live preview (MVP)
- [ ] `@md2jira-previewer/core` published to npm
- [ ] CLI (`md2jira-previewer` command)
- [ ] VSCode Extension
- [ ] Atlassian Document Format (ADF) output
- [ ] Confluence export

---

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a PR.

This project uses [Conventional Commits](https://www.conventionalcommits.org/). Your commit messages must follow the format:

```
feat(core): add support for definition lists
fix(tables): handle cells with pipe characters
```

---

## License

MIT © [danielmontes9](https://github.com/danielmontes9)
