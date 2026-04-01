# AGENTS.md  md2jira-previewer

> This file provides context and instructions for AI coding agents (GitHub Copilot, Claude Code, OpenAI Codex, Cursor, etc.) working on this repository.
> Read this file completely before making any changes.

---

## Project Overview

**md2jira-previewer** is an open-source tool that converts Markdown documents into Jira Wiki Markup.

- **Web App (MVP)**: React 18 + Vite + Magic UI + Tailwind CSS  live two-panel converter in the browser.
- **Core package** (`packages/core`): Pure TypeScript, zero browser/React dependencies  the conversion engine.
- **Future targets**: CLI (`commander`) and VSCode Extension  both will reuse `md2jira-core`.

---

## Architecture Rules  NON-NEGOTIABLE

1. **`packages/core` must be 100% framework-agnostic.** Never import React, DOM APIs, `window`, `document`, or any browser-specific module inside `packages/core/`. Violations break CLI and VSCode extension compatibility.

2. **`apps/web` is the only place for React and browser code.** It imports `md2jira-core` as a dependency.

3. **The public API of `packages/core` is `convert(md: string): string`.** Do not change its signature without adding a `BREAKING CHANGE` footer in the commit.

4. **No nested tables support**  out of scope for MVP. Do not implement it.

5. **No HTML passthrough**  Markdown HTML blocks (`<div>`, `<br>`) are out of scope for MVP. Ignore or strip silently.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript (strict mode) |
| MD Parser | `remark-parse` + `unified` |
| AST types | `@types/mdast` |
| UI Framework | React 18 |
| Build tool | Vite |
| UI Components | Magic UI |
| Styling | Tailwind CSS v4 |
| Testing | Vitest |
| Package manager | pnpm (workspaces) |
| Linting | ESLint + `@typescript-eslint` |
| Formatting | Prettier |
| Commits | Conventional Commits (enforced by commitlint) |
| Versioning | semantic-release |

---

## Repository Structure

```
md2jira-previewer/
 .github/
    copilot-instructions.md    GitHub Copilot specific context
    ISSUE_TEMPLATE/
    PULL_REQUEST_TEMPLATE.md
    workflows/
        ci.yml                 lint + typecheck + test on every PR
        release.yml            semantic-release on merge to main
 packages/
    core/                      md2jira-core  pure TS conversion engine
        src/
           index.ts           export convert(md: string): string
           converter.ts       orchestrates the pipeline
           transforms/
               headers.ts
               tables.ts      most complex  handle with care
               lists.ts
               formatting.ts  bold, italic, code, strike
               codeblocks.ts
               index.ts
        tests/
 apps/
    web/                       React + Vite + Magic UI
        src/
            App.tsx
            components/
            main.tsx
 AGENTS.md                      YOU ARE HERE
 CONTRIBUTING.md
 README.md
 package.json                   pnpm workspaces root
 pnpm-workspace.yaml
```

---

## Conversion Pipeline

```
Input Markdown string
       
       
  remark-parse
       
       
  mdast (AST)
       
       
  transforms/ (visit each node type)
       
        heading       h1. / h2. ... h6.
        paragraph     inline formatting
        strong        *bold*
        emphasis      _italic_
        delete        -strike-
        inlineCode    {{code}}
        code          {code:language=js} ... {code}
        list          * item / # item (with nesting via **)
        blockquote    bq. text
        thematicBreak ----
        link          [text|url]
        table         || header || / | cell |
               
                (special handling: multiline, escape, normalization)
       
       
  Jira Wiki Markup string
```

---

## Tables  Handle with Care

Tables are the most complex transform. Key rules:

- First row  `|| header ||` syntax
- Other rows  `| cell |` syntax
- Multiline cell content  join with `<br>`
- Normalize column count: fill missing cells with empty `| |`
- Escape `|` inside cells as `\|`
- Escape `{...}` as `\{...\}`
- Escape `[text]` (no URL) as `\[text\]`
- Inline formatting (bold, italic, links, code) must be converted inside cells

---

## Coding Standards

- **TypeScript strict mode**  no `any`, no `// @ts-ignore` without explanation
- **Functional style preferred**  pure functions, no mutation of AST nodes
- **Tests are mandatory** for every transform function in `packages/core`
- **Test file naming**: `*.test.ts` placed in `packages/core/tests/`
- **No default exports**  use named exports everywhere
- **Imports**: use path aliases configured in `tsconfig.json`, not relative `../../../`

---

## Commit Convention

All commits MUST follow [Conventional Commits v1.0](https://www.conventionalcommits.org/):

```
<type>[scope]: <imperative description>
```

**Valid types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

**Valid scopes**: `core`, `web`, `tables`, `lists`, `headers`, `formatting`, `codeblocks`, `cli`, `ci`, `readme`

```bash
# Good examples
feat(core): add blockquote conversion
fix(tables): normalize unequal column count
docs: add usage section to README
test(core): add edge cases for multiline table cells
chore: upgrade remark-parse to v11

# Breaking change
feat(core)!: convert() now accepts optional ConvertOptions

BREAKING CHANGE: second argument is now ConvertOptions object
```

---

## What AI Agents Should NOT Do

- Do NOT add HTML support  out of scope
- Do NOT implement nested table support  out of scope for MVP
- Do NOT import browser APIs inside `packages/core/`
- Do NOT add `any` type without a comment explaining why
- Do NOT skip writing tests when adding a new transform
- Do NOT change `convert(md: string): string` signature without `BREAKING CHANGE`
- Do NOT add dependencies without updating `pnpm-lock.yaml`
- Do NOT commit directly to `main`  use feature branches

---

## Running the Project

```bash
# Install all dependencies (root)
pnpm install

# Run web app dev server
pnpm --filter web dev

# Run core tests
pnpm --filter core test

# Run all tests
pnpm test

# Build core
pnpm --filter core build

# Lint all
pnpm lint

# Type check all
pnpm typecheck
```

---

## Error Handling Expectations

| Case | Expected behavior |
|------|------------------|
| Empty input | Return empty string, no error |
| Invalid Markdown | Parse what's possible, no crash |
| Table without separator row | Treat first row as header |
| Table with unequal columns | Pad missing cells with empty string |
| Heading level > 6 | Normalize to h6 |
| Code block without language | Output `{code}` without language attribute |
| Link with no text `[](url)` | Output `[url]` |
| Image `![alt](src)` | Ignore silently (out of scope) |

---

## Open Source Notes

- License: **MIT**
- Contributions welcome  see `CONTRIBUTING.md`
- Report security issues in `SECURITY.md`, do not open public issues
- Follow `CODE_OF_CONDUCT.md` (Contributor Covenant v2.1)
