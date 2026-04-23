import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { App } from '../src/App.js'

// Minimal browser API stubs required by App (same as App.test.tsx)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockReturnValue({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }),
})
Object.defineProperty(window, 'localStorage', {
  writable: true,
  value: { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() },
})
Object.defineProperty(window, 'requestIdleCallback', {
  writable: true,
  value: (cb: IdleRequestCallback) => cb({ didTimeout: false, timeRemaining: () => 50 }),
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
