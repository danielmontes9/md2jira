import type { Code } from 'mdast'

/**
 * Maps common short language identifiers to the canonical name Jira recognises
 * for syntax highlighting. Unknown values pass through unchanged so future
 * Jira releases with new language support work without code changes.
 */
const LANG_ALIASES: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  rb: 'ruby',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  yml: 'yaml',
  md: 'none',
  plaintext: 'none',
  txt: 'none',
}

/** Resolves a raw fence language to the canonical Jira identifier. */
export function resolveLanguage(lang: string): string {
  return LANG_ALIASES[lang.toLowerCase()] ?? lang
}

export function transformCodeBlock(node: Code): string {
  if (node.lang) {
    return `{code:language=${resolveLanguage(node.lang)}}\n${node.value}\n{code}`
  }
  return `{code}\n${node.value}\n{code}`
}
