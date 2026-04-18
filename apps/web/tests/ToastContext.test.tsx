import { describe, it, expect } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { createElement } from 'react'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { ToastProvider, useToast } from '../src/context/ToastContext.js'

function wrapper({ children }: { children: ReactNode }) {
  return createElement(ToastProvider, null, children)
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

    render(createElement(ToastProvider, null, createElement(TestConsumer)))

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

    render(createElement(ToastProvider, null, createElement(TestConsumer)))

    await act(async () => {
      screen.getByRole('button', { name: 'first' }).click()
      screen.getByRole('button', { name: 'second' }).click()
    })

    expect(screen.getByText('First')).toBeInTheDocument()
    expect(screen.getByText('Second')).toBeInTheDocument()
  })
})
