import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { Toast, ToastContainer } from '../src/components/Toast.js'

describe('Toast', () => {
  it('renders the message', () => {
    render(<Toast message="Hello toast" onClose={vi.fn()} />)
    expect(screen.getByText('Hello toast')).toBeInTheDocument()
  })

  it('has role="alert"', () => {
    render(<Toast message="Alert" onClose={vi.fn()} />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('calls onClose when dismiss button is clicked', () => {
    vi.useFakeTimers()
    const onClose = vi.fn()
    render(<Toast message="Dismiss me" onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }))
    // onClose is deferred by 200ms animation delay
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(onClose).toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('auto-dismisses after duration', () => {
    vi.useFakeTimers()
    const onClose = vi.fn()
    render(<Toast message="Auto" onClose={onClose} duration={1000} />)
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    // After duration, the fade-out starts, then onClose fires after 200ms
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(onClose).toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('renders correct style for error type', () => {
    render(<Toast message="Error" type="error" onClose={vi.fn()} />)
    const alert = screen.getByRole('alert')
    expect(alert.className).toContain('red')
  })

  it('renders correct style for success type', () => {
    render(<Toast message="Success" type="success" onClose={vi.fn()} />)
    const alert = screen.getByRole('alert')
    expect(alert.className).toContain('green')
  })

  it('renders correct style for warning type', () => {
    render(<Toast message="Warning" type="warning" onClose={vi.fn()} />)
    const alert = screen.getByRole('alert')
    expect(alert.className).toContain('amber')
  })

  it('renders correct style for info type (default)', () => {
    render(<Toast message="Info" type="info" onClose={vi.fn()} />)
    const alert = screen.getByRole('alert')
    expect(alert.className).toContain('neutral')
  })
})

describe('ToastContainer', () => {
  it('renders nothing when toasts array is empty', () => {
    const { container } = render(<ToastContainer toasts={[]} onClose={vi.fn()} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders multiple toasts', () => {
    const toasts = [
      { id: 1, message: 'First', type: 'info' as const },
      { id: 2, message: 'Second', type: 'error' as const },
    ]
    render(<ToastContainer toasts={toasts} onClose={vi.fn()} />)
    expect(screen.getByText('First')).toBeInTheDocument()
    expect(screen.getByText('Second')).toBeInTheDocument()
  })

  it('calls onClose with the correct toast id', () => {
    vi.useFakeTimers()
    const onClose = vi.fn()
    const toasts = [{ id: 42, message: 'Close me', type: 'info' as const }]
    render(<ToastContainer toasts={toasts} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }))
    act(() => {
      vi.advanceTimersByTime(200)
    })
    expect(onClose).toHaveBeenCalledWith(42)
    vi.useRealTimers()
  })
})
