import { useEffect, useRef, type ReactNode } from 'react'

interface ModalProps {
  onClose: () => void
  ariaLabelledBy: string
  children: ReactNode
}

export function Modal({ onClose, ariaLabelledBy, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    dialog.showModal()
    // The native `cancel` event fires when the user presses Escape.
    const handleCancel = (e: Event) => {
      e.preventDefault() // suppress default close so we control it
      onClose()
    }
    dialog.addEventListener('cancel', handleCancel)
    return () => dialog.removeEventListener('cancel', handleCancel)
  }, [onClose])

  return (
    <dialog
      ref={dialogRef}
      // Make the <dialog> itself the full-viewport overlay so backdrop clicks
      // can be detected via e.target === e.currentTarget.
      className="fixed inset-0 m-0 flex h-dvh w-full max-h-none max-w-none items-center justify-center border-0 bg-black/50 p-4 backdrop-blur-sm backdrop:bg-transparent"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      aria-labelledby={ariaLabelledBy}
    >
      {children}
    </dialog>
  )
}
