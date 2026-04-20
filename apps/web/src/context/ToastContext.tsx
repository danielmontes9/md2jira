import { createContext, useContext, useCallback, useState, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ToastContainer } from '../components/Toast.js'
import type { ToastType } from '../components/Toast.js'

interface ToastContextValue {
  addToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

/** Provides a global toast notification system. Renders a single ToastContainer. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<{ id: number; message: string; type: ToastType }[]>([])
  const toastIdRef = useRef(0)

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++toastIdRef.current
    setToasts((prev) => {
      const next = [...prev, { id, message, type }]
      // Cap at 5 to prevent unbounded growth in error-loop scenarios.
      return next.length > 5 ? next.slice(next.length - 5) : next
    })
  }, [])

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {createPortal(<ToastContainer toasts={toasts} onClose={removeToast} />, document.body)}
    </ToastContext.Provider>
  )
}

/** Returns the `addToast` function. Must be used inside a `<ToastProvider>`. */
export function useToast(): (message: string, type?: ToastType) => void {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx.addToast
}
