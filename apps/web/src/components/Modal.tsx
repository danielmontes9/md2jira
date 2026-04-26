import { useEffect, useRef, useState, useCallback, type ReactNode } from 'react'

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
    const ac = new AbortController()
    dialog.addEventListener('cancel', handleCancel, { signal: ac.signal })
    return () => ac.abort()
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

// ── ShareModal ──────────────────────────────────────────────────────────────

interface ShareModalProps {
  url: string
  onClose: () => void
}

/** Modal that displays a shareable URL with a one-click copy button. */
export function ShareModal({ url, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current)
    }
  }, [])

  const handleCopy = useCallback(() => {
    navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopied(true)
        if (timerRef.current !== null) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => setCopied(false), 2_000)
      })
      .catch(() => {})
  }, [url])

  return (
    <Modal onClose={onClose} ariaLabelledBy="share-modal-title">
      <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
        <div className="mb-4 flex items-center justify-between">
          <h2
            id="share-modal-title"
            className="text-base font-semibold text-neutral-800 dark:text-neutral-100"
          >
            Share document
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          >
            ✕
          </button>
        </div>
        <p className="mb-3 text-sm text-neutral-500 dark:text-neutral-400">
          Share this link so others can view your converted Markdown document.
        </p>
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800">
          <span className="min-w-0 flex-1 truncate font-mono text-xs text-neutral-700 dark:text-neutral-300">
            {url}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400"
        >
          {copied ? 'Copied!' : 'Copy link to share'}
        </button>
      </div>
    </Modal>
  )
}
