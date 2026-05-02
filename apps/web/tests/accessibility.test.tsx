import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { render } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { App } from '../src/App.js'

// Replace CodeMirror with a native <textarea> to avoid jsdom incompatibilities
// (textRange().getClientRects) that would cause spurious accessibility violations.
vi.mock('../src/hooks/useCodeMirrorEditor.js', async () => {
  const { useEffect, useRef } = await import('react')
  return {
    useCodeMirrorEditor: ({
      containerRef,
      value,
      onChange,
      placeholderText = 'Paste your Markdown here...',
    }: {
      containerRef: { current: HTMLDivElement | null }
      value: string
      onChange: (value: string) => void
      isDark?: boolean
      placeholderText?: string
      onSave?: () => void
    }) => {
      const onChangeRef = useRef(onChange)
      useEffect(() => {
        onChangeRef.current = onChange
      }, [onChange])
      useEffect(() => {
        const container = containerRef.current
        if (!container) return
        let ta = container.querySelector<HTMLTextAreaElement>('textarea')
        if (!ta) {
          ta = document.createElement('textarea')
          ta.placeholder = placeholderText
          ta.addEventListener('change', (e) => {
            onChangeRef.current((e.target as HTMLTextAreaElement).value)
          })
          container.appendChild(ta)
        }
        ta.value = value
      })
      return { undo: vi.fn(), redo: vi.fn(), openSearch: vi.fn() }
    },
  }
})

// Use vi.stubGlobal (instead of Object.defineProperty at module level) so vitest
// can restore the originals after this file's tests run, preventing cross-file
// global pollution in shared worker pools.
beforeAll(() => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
  )
  vi.stubGlobal('localStorage', {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  })
  vi.stubGlobal('requestIdleCallback', (cb: IdleRequestCallback) =>
    cb({ didTimeout: false, timeRemaining: () => 50 })
  )
})

afterAll(() => {
  vi.unstubAllGlobals()
})

describe('Automated accessibility (axe-core)', () => {
  it('App renders with no WCAG 2.x violations', async () => {
    const { container } = render(<App />)
    const results = await axe(container, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
      // color-contrast requires canvas API unavailable in jsdom; skip it here,
      // it is covered by the Playwright / @axe-core/playwright e2e suite.
      rules: { 'color-contrast': { enabled: false } },
    })
    const summary = results.violations
      .map((v) => `  [${v.id}] ${v.help} — ${v.nodes[0]?.target.join(', ')}`)
      .join('\n')
    expect(results.violations, `WCAG violations found:\n${summary}`).toHaveLength(0)
  })
})
