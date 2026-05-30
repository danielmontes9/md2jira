# GitHub Copilot Instructions — md2jira

## Project Context

md2jira converts Markdown to Jira Wiki Markup. It is structured as a pnpm monorepo:

- `packages/core` — pure TypeScript conversion engine, zero browser/React dependencies
- `apps/web` — React 18 + Vite + Magic UI web application

Read `AGENTS.md` at the repo root for complete architecture documentation.

## Critical Rules

- NEVER import React, DOM APIs, or browser globals (`window`, `document`, `navigator`) inside `packages/core/`
- The public API is `convert(md: string): string` — do not change its signature without a BREAKING CHANGE commit
- Every new transform function in `packages/core/` must have a corresponding test in `packages/core/tests/`
- Use named exports only — no default exports
- TypeScript strict mode — no `any` without explanation

## Commit Messages

Always use Conventional Commits format:

```
feat(core): add strikethrough conversion
fix(tables): handle pipe characters inside cells
test(core): add edge cases for empty table cells
```

## Code Style

- Functional style — pure functions, no AST mutation
- Use `@types/mdast` node types when traversing the AST
- Prefer `unified` visitor pattern (`visit(tree, 'nodeType', handler)`)
- Tailwind CSS for styling in `apps/web` — no inline styles
- Magic UI components for UI elements in `apps/web`

## Out of Scope (do not implement)

- HTML passthrough in Markdown
- Nested tables
- Frontmatter (YAML/TOML headers — skip silently)
- ADF inline images — ADF spec has no inline image node; images mixed with text in a paragraph are silently dropped

## Image Conversion (implemented)

| Pipeline                  | Input                     | Output                                                                    |
| ------------------------- | ------------------------- | ------------------------------------------------------------------------- |
| Wiki Markup               | `![alt](url)`             | `!url!`                                                                   |
| Wiki Markup (with params) | `![alt](url "width=200")` | `!url\|width=200!`                                                        |
| ADF (Jira Cloud)          | Standalone `![alt](url)`  | `mediaSingle` block node                                                  |
| ADF (Jira Cloud)          | Inline mixed with text    | Lifted to adjacent `mediaSingle` block (no inline image type in ADF spec) |
| Confluence                | `![alt](url)`             | `<ac:image><ri:url ri:value="url"/></ac:image>`                           |

Jira image params use the Markdown title field: `![alt](img.png "width=200,align=right")`
