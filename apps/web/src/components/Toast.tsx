import { useEffect, useState, type ReactElement } from 'react'
import { IconAlertCircle, IconCheck, IconClose } from './icons.js'

export type ToastType = 'error' | 'success' | 'info'

interface ToastProps {
  message: string
  type?: ToastType
  onClose: () => void
  duration?: number
}

const styles: Record<ToastType, string> = {
  error:
    'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200',
  success:
    'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200',
  info: 'border-neutral-200 bg-white text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200',
}

const icons: Record<ToastType, ReactElement> = {
  error: <IconAlertCircle />,
  success: <IconCheck />,
  info: <IconAlertCircle />,
}

export function Toast({ message, type = 'info', onClose, duration = 7000 }: ToastProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setVisible(true))
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 200)
    }, duration)
    return () => clearTimeout(timer)
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
        onClick={() => {
          setVisible(false)
          setTimeout(onClose, 200)
        }}
        className="ml-1 shrink-0 opacity-60 transition-opacity hover:opacity-100"
        aria-label="Dismiss"
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
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2" aria-label="Notifications">
      {toasts.map((t) => (
        <Toast key={t.id} message={t.message} type={t.type} onClose={() => onClose(t.id)} />
      ))}
    </div>
  )
}
