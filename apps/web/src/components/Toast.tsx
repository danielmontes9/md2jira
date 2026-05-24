import { useEffect, useRef, useState, type ReactElement } from 'react'
import {
  IconAlertCircle,
  IconCheck,
  IconClose,
  IconInfoCircle,
  IconWarningTriangle,
} from './icons.js'

export type ToastType = 'error' | 'success' | 'info' | 'warning'

interface ToastProps {
  message: string
  type?: ToastType
  onClose: () => void
  duration?: number
  dismissLabel?: string
}

const styles: Record<ToastType, string> = {
  error:
    'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200',
  success:
    'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200',
  info: 'border-neutral-200 bg-white text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200',
  warning:
    'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200',
}

const icons: Record<ToastType, ReactElement> = {
  error: <IconAlertCircle />,
  success: <IconCheck />,
  info: <IconInfoCircle />,
  warning: <IconWarningTriangle />,
}

export function Toast({
  message,
  type = 'info',
  onClose,
  duration = 7000,
  dismissLabel = 'Dismiss',
}: ToastProps) {
  const [visible, setVisible] = useState(false)
  const innerTimerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setVisible(true))
    const outerTimer = setTimeout(() => {
      setVisible(false)
      innerTimerRef.current = setTimeout(onClose, 200)
    }, duration)
    return () => {
      clearTimeout(outerTimer)
      clearTimeout(innerTimerRef.current)
    }
  }, [duration, onClose])

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm shadow-lg transition-all duration-200 ${styles[type]} ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
      }`}
    >
      <span className="mt-px shrink-0">{icons[type]}</span>
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={() => {
          setVisible(false)
          innerTimerRef.current = setTimeout(onClose, 200)
        }}
        className="ml-1 shrink-0 rounded opacity-60 transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500"
        aria-label={dismissLabel}
      >
        <IconClose className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

// Container rendered at the bottom-right of the screen
interface ToastContainerProps {
  toasts: { id: number; message: string; type: ToastType }[]
  onClose: (id: number) => void
  dismissLabel?: string
}

export function ToastContainer({ toasts, onClose, dismissLabel }: ToastContainerProps) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2" aria-label="Notifications">
      {toasts.map((t) => (
        <Toast
          key={t.id}
          message={t.message}
          type={t.type}
          onClose={() => onClose(t.id)}
          dismissLabel={dismissLabel ?? 'Dismiss'}
        />
      ))}
    </div>
  )
}
