# Contributing to md2jira

Thank you for your interest in contributing! This document explains how to set up the project, the workflow for submitting changes, and the standards we follow.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)
- [Project Structure](#project-structure)
- [Working with AI Agents](#working-with-ai-agents)

---

## Code of Conduct

By participating, you agree to our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

---

## Getting Started

### Prerequisites

- **Node.js** >= 22
- **pnpm** >= 9 (`npm install -g pnpm`)
- **Git**

### Local Setup

```bash
# 1. Fork and clone
git clone https://github.com/YOUR-USERNAME/md2jira.git
cd md2jira

# 2. Install all dependencies (monorepo)
pnpm install

# 3. Run the web app
pnpm --filter web dev

# 4. Run tests
pnpm test

# 5. Type check
pnpm typecheck

# 6. Lint
pnpm lint
```

---

## Development Workflow

### 1. Create a branch

Always branch from `main`:

```bash
git checkout main
git pull origin main
git checkout -b feat/your-feature-name
# or
git checkout -b fix/your-bug-description
```

Branch naming convention:

- `feat/<scope>-<description>` new feature
- `fix/<scope>-<description>` bug fix
- `docs/<description>` documentation only
- `refactor/<scope>-<description>` refactor without logic change
- `test/<scope>-<description>` adding tests

### 2. Make your changes

- Read `AGENTS.md` for architectural rules before touching any file
- **Never** add browser/React imports inside `packages/core/`
- Add or update tests for any logic change in `packages/core/`
- Run `pnpm test` and `pnpm typecheck` before committing

### 3. Commit your changes

This project enforces [Conventional Commits](https://www.conventionalcommits.org/) via `commitlint`. An invalid commit message will be rejected.

```bash
# Valid
git commit -m "feat(core): add support for strikethrough"
git commit -m "fix(tables): escape pipe characters inside cells"
git commit -m "docs: add CLI usage examples to README"
git commit -m "test(core): add multiline table cell edge cases"

# Breaking change
git commit -m "feat(core)!: convert() now accepts options object

BREAKING CHANGE: second argument is now ConvertOptions"
```

### 4. Open a Pull Request

Push your branch and open a PR against `main`:

```bash
git push origin feat/your-feature-name
```

Fill in the PR template completely. CIs must pass before merge.

---

## Commit Convention

Format:

```
<type>[scope]: <description in imperative mood>

[optional body]

[optional footer: BREAKING CHANGE / closes #issue]
```

| Type       | Use for                      |
| ---------- | ---------------------------- |
| `feat`     | New functionality            |
| `fix`      | Bug fix                      |
| `docs`     | Documentation only           |
| `style`    | Formatting, no logic change  |
| `refactor` | Code change without feat/fix |
| `perf`     | Performance improvement      |
| `test`     | Adding or fixing tests       |
| `build`    | Build system, dependencies   |
| `ci`       | CI/CD configuration          |
| `chore`    | Maintenance tasks            |
| `revert`   | Reverting a commit           |

Valid scopes: `core`, `web`, `tables`, `lists`, `headers`, `formatting`, `codeblocks`, `cli`, `ci`, `readme`

---

## Pull Request Process

1. Fill in the PR template
2. Ensure CI passes: `lint`, `typecheck`, `test`
3. Link related issues with `closes #123` in the PR description
4. Request a review maintainer will review within a few days
5. Squash merge is used your branch history is squashed into one clean commit on `main`

**PRs that will be rejected:**

- Changes to `packages/core/` with no tests
- Browser/DOM imports inside `packages/core/`
- Commits not following Conventional Commits
- Changes that break the `convert(md: string): string` API without a `BREAKING CHANGE` note

---

## Project Structure

```
packages/core/      Conversion engine. Pure TypeScript. No browser deps.
apps/web/           React web app. Can use browser APIs and React.
```

See `AGENTS.md` for full architecture documentation.

---

## Working with AI Agents

This project is optimized for AI-assisted development. If you use GitHub Copilot, Claude Code, Cursor, or similar tools:

1. Point your agent to `AGENTS.md` for full project context
2. The `.github/copilot-instructions.md` file is automatically loaded by GitHub Copilot in VS Code
3. The agent will follow the same coding standards described in this document

---

## Reporting Bugs

Use the [bug report template](https://github.com/danielmontes9/md2jira/issues/new?template=bug_report.md). Include:

- Markdown input that causes the issue
- Expected Jira Wiki Markup output
- Actual output
- Browser or Node.js version

## Suggesting Features

Use the [feature request template](https://github.com/danielmontes9/md2jira/issues/new?template=feature_request.md).

## Security Issues

Do **not** open a public issue for security vulnerabilities. See [SECURITY.md](SECURITY.md).
