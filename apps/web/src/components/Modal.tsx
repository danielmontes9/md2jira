import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useId,
  createContext,
  useContext,
  type ReactNode,
} from 'react'
import { useT } from '../i18n/index.js'

const ANIM_MS = 200

// Animation-aware close handler provided to all descendants inside a Modal.
// Consuming close buttons call this instead of the onClose prop directly so
// the exit animation completes before the parent unmounts the component.
const ModalCloseContext = createContext<() => void>(() => {})

/** Hook used by close buttons rendered inside a Modal to trigger animated close. */
export const useModalClose = () => useContext(ModalCloseContext)

interface ModalCloseButtonProps {
  className?: string
  'aria-label'?: string
  children: ReactNode
}

/** A close button that plays the modal's exit animation before unmounting. */
export function ModalCloseButton({
  className,
  'aria-label': ariaLabel,
  children,
}: ModalCloseButtonProps) {
  const handleClose = useModalClose()
  return (
    <button type="button" onClick={handleClose} className={className} aria-label={ariaLabel}>
      {children}
    </button>
  )
}

interface ModalProps {
  onClose: () => void
  ariaLabelledBy: string
  children: ReactNode
}

export function Modal({ onClose, ariaLabelledBy, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [closing, setClosing] = useState(false)
  const closingRef = useRef(false)

  const handleClose = useCallback(() => {
    if (closingRef.current) return
    closingRef.current = true
    setClosing(true)
    setTimeout(() => onClose(), ANIM_MS)
  }, [onClose])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    dialog.showModal()
    // The native `cancel` event fires when the user presses Escape.
    const handleCancel = (e: Event) => {
      e.preventDefault() // suppress default close so we control it
      handleClose()
    }
    const ac = new AbortController()
    dialog.addEventListener('cancel', handleCancel, { signal: ac.signal })
    return () => ac.abort()
  }, [handleClose])

  return (
    <ModalCloseContext.Provider value={handleClose}>
      <dialog
        ref={dialogRef}
        // Make the <dialog> itself the full-viewport overlay so backdrop clicks
        // can be detected via e.target === e.currentTarget.
        className={`fixed inset-0 m-0 flex h-dvh w-full max-h-none max-w-none items-center justify-center border-0 bg-black/50 p-4 backdrop-blur-sm backdrop:bg-transparent ${
          closing ? 'modal-dialog-closing' : 'modal-dialog'
        }`}
        onClick={(e) => {
          if (e.target === e.currentTarget) handleClose()
        }}
        aria-labelledby={ariaLabelledBy}
      >
        {children}
      </dialog>
    </ModalCloseContext.Provider>
  )
}

// ── ConfirmModal ────────────────────────────────────────────────────────────

interface ConfirmModalProps {
  title: string
  description?: string
  confirmLabel: string
  /** 'red' for destructive actions, 'blue' (default) for neutral confirmations. */
  confirmVariant?: 'blue' | 'red'
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
}

function ConfirmModalInner({
  title,
  description,
  confirmLabel,
  confirmVariant = 'blue',
  cancelLabel,
  modalId,
  onRequestConfirm,
}: Omit<ConfirmModalProps, 'onConfirm' | 'onCancel'> & {
  modalId: string
  onRequestConfirm: () => void
}) {
  const handleClose = useModalClose()
  return (
    <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-6 shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
      <h2
        id={modalId}
        className="mb-1 text-base font-semibold text-neutral-900 dark:text-neutral-100"
      >
        {title}
      </h2>
      {description && (
        <p className="mb-5 text-sm text-neutral-500 dark:text-neutral-400">{description}</p>
      )}
      <div className={`flex justify-end gap-2${!description ? ' mt-5' : ''}`}>
        <ModalCloseButton
          className="rounded-lg px-4 py-2 text-sm text-neutral-600 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          aria-label={cancelLabel}
        >
          {cancelLabel}
        </ModalCloseButton>
        <button
          type="button"
          onClick={() => {
            onRequestConfirm()
            handleClose()
          }}
          className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
            confirmVariant === 'red'
              ? 'bg-red-600 hover:bg-red-700 focus-visible:outline-red-500'
              : 'bg-blue-600 hover:bg-blue-700 focus-visible:outline-blue-500'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  )
}

/**
 * A generic animated confirmation modal.
 * The `onConfirm` callback fires *after* the exit animation completes —
 * the confirm button records intent (`onRequestConfirm`) via a ref and
 * immediately triggers `handleClose()`, so the dialog closes smoothly
 * before any state updates happen in the parent.
 */
export function ConfirmModal({ onConfirm, onCancel, ...rest }: ConfirmModalProps) {
  const modalId = useId()
  // useRef instead of useState so the value is available synchronously
  // inside the setTimeout closure when Modal.onClose fires after ANIM_MS.
  const confirmedRef = useRef(false)
  return (
    <Modal
      onClose={() => {
        if (confirmedRef.current) onConfirm()
        else onCancel()
      }}
      ariaLabelledBy={modalId}
    >
      <ConfirmModalInner
        {...rest}
        modalId={modalId}
        onRequestConfirm={() => {
          confirmedRef.current = true
        }}
      />
    </Modal>
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
  const t = useT()
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
            {t('shareDocumentTitle')}
          </h2>
          <ModalCloseButton
            aria-label={t('close')}
            className="rounded-md p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          >
            ✕
          </ModalCloseButton>
        </div>
        <p className="mb-3 text-sm text-neutral-500 dark:text-neutral-400">
          {t('shareDocumentDesc')}
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
          {copied ? t('copied') : t('copyLinkToShare')}
        </button>
      </div>
    </Modal>
  )
}
