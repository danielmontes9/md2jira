import { lazy, type ComponentType } from 'react'

/**
 * Wraps React.lazy to work with named exports, eliminating the
 * `.then(m => ({ default: m.ExportName }))` boilerplate.
 *
 * Usage:
 *   const MyComponent = lazyNamed(() => import('./MyComponent.js'), 'MyComponent')
 *
 * The generic constraints let TypeScript infer the correct component prop types
 * from the dynamic import so callers get full type-checking without annotations.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- ComponentType<any> is the standard typing for "any React component" in generic factory functions
export function lazyNamed<M extends Record<K, ComponentType<any>>, K extends keyof M & string>(
  importFn: () => Promise<M>,
  exportName: K
) {
  return lazy(() =>
    importFn().then((m) => {
      const component = m[exportName]
      if (!component) throw new Error(`[lazyNamed] Named export "${exportName}" not found`)
      return { default: component }
    })
  )
}
