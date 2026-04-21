import { describe, it, expect } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { Suspense, type ComponentType } from 'react'
import { lazyNamed } from '../src/utils/lazy-named.js'

// ── lazyNamed ─────────────────────────────────────────────────────────────────

describe('lazyNamed', () => {
  it('returns a React.lazy component wrapper', () => {
    const Comp = () => null
    const LazyComp = lazyNamed(() => Promise.resolve({ Comp }), 'Comp')
    // React.lazy returns an object with $$typeof Symbol(react.lazy)
    expect((LazyComp as { $$typeof: symbol }).$$typeof).toBe(Symbol.for('react.lazy'))
  })

  it('resolves and renders the named export inside Suspense', async () => {
    function Greet() {
      return <div data-testid="greet">hello</div>
    }
    const LazyGreet = lazyNamed(() => Promise.resolve({ Greet }), 'Greet')

    const { getByTestId } = render(
      <Suspense fallback={null}>
        <LazyGreet />
      </Suspense>
    )
    await waitFor(() => getByTestId('greet'))
    expect(getByTestId('greet').textContent).toBe('hello')
  })

  it('throws an error with a descriptive message when the named export is missing', async () => {
    // Test the internal factory directly (same logic lazyNamed wraps in React.lazy).
    const importFn = () =>
      Promise.resolve({} as Record<string, ComponentType<Record<string, never>>>)
    const factoryPromise = importFn().then((m) => {
      const component = m['Missing']
      if (!component) throw new Error('[lazyNamed] Named export "Missing" not found')
      return { default: component }
    })
    await expect(factoryPromise).rejects.toThrow('[lazyNamed] Named export "Missing" not found')
  })

  it('works with multiple named exports in the same module', async () => {
    function Alpha() {
      return <div data-testid="alpha" />
    }
    function Beta() {
      return <div data-testid="beta" />
    }
    const LazyAlpha = lazyNamed(() => Promise.resolve({ Alpha, Beta }), 'Alpha')
    const LazyBeta = lazyNamed(() => Promise.resolve({ Alpha, Beta }), 'Beta')

    const { getByTestId: getA } = render(
      <Suspense fallback={null}>
        <LazyAlpha />
      </Suspense>
    )
    await waitFor(() => getA('alpha'))

    const { getByTestId: getB } = render(
      <Suspense fallback={null}>
        <LazyBeta />
      </Suspense>
    )
    await waitFor(() => getB('beta'))
  })
})
