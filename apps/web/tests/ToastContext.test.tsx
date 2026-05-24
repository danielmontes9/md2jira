import { describe, it, expect } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { createElement } from 'react'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { ToastProvider, useToast } from '../src/context/ToastContext.js'
import { SettingsProvider } from '../src/context/SettingsContext.js'

function wrapper({ children }: { children: ReactNode }) {
  return createElement(SettingsProvider, null, createElement(ToastProvider, null, children))
}

function withProviders(element: ReactNode) {
  return createElement(SettingsProvider, null, createElement(ToastProvider, null, element))
}

describe('ToastContext', () => {
  it('useToast throws when used outside <ToastProvider>', () => {
    expect(() => renderHook(() => useToast())).toThrow(
      'useToast must be used inside <ToastProvider>'
    )
  })

  it('useToast returns a function inside <ToastProvider>', () => {
    const { result } = renderHook(() => useToast(), { wrapper })
    expect(typeof result.current).toBe('function')
  })

  it('addToast renders a toast message in the container', async () => {
    function TestConsumer() {
      const addToast = useToast()
      return <button onClick={() => addToast('Hello toast')}>trigger</button>
    }

    render(withProviders(createElement(TestConsumer)))

    await act(async () => {
      screen.getByRole('button', { name: 'trigger' }).click()
    })

    expect(screen.getByText('Hello toast')).toBeInTheDocument()
  })

  it('multiple addToast calls accumulate separate toasts', async () => {
    function TestConsumer() {
      const addToast = useToast()
      return (
        <>
          <button onClick={() => addToast('First')}>first</button>
          <button onClick={() => addToast('Second')}>second</button>
        </>
      )
    }

    render(withProviders(createElement(TestConsumer)))

    await act(async () => {
      screen.getByRole('button', { name: 'first' }).click()
      screen.getByRole('button', { name: 'second' }).click()
    })

    expect(screen.getByText('First')).toBeInTheDocument()
    expect(screen.getByText('Second')).toBeInTheDocument()
  })

  it('caps the toast list at 5 — oldest toast is dropped when a 6th is added', async () => {
    function TestConsumer() {
      const addToast = useToast()
      return (
        <button
          onClick={() => {
            for (let i = 1; i <= 6; i++) {
              addToast(`Toast ${i}`)
            }
          }}
        >
          trigger
        </button>
      )
    }

    render(withProviders(createElement(TestConsumer)))

    await act(async () => {
      screen.getByRole('button', { name: 'trigger' }).click()
    })

    // Only 5 toasts should be visible — the oldest ('Toast 1') is discarded
    expect(screen.queryByText('Toast 1')).not.toBeInTheDocument()
    expect(screen.getByText('Toast 2')).toBeInTheDocument()
    expect(screen.getByText('Toast 6')).toBeInTheDocument()
  })
})
