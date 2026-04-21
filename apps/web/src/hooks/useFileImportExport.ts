import {
  useRef,
  useCallback,
  useState,
  type ChangeEvent,
  type DragEvent,
  type RefObject,
} from 'react'
import type { ToastType } from '../components/Toast.js'

export interface FileImportExportState {
  fileInputRef: RefObject<HTMLInputElement>
  handleImport: () => void
  handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void
  handleExport: () => void
  handleDragOver: (e: DragEvent) => void
  handleDragLeave: (e: DragEvent) => void
  handleDrop: (e: DragEvent) => void
  isDragging: boolean
}

const ALLOWED_EXTENSIONS = ['.md', '.txt', '.text']
/** Maximum file size allowed for import (1 MB). */
const MAX_FILE_SIZE = 1_048_576

/**
 * Validates file extension and size, then reads the file as text.
 * Calls `onSuccess` with the file text, or `onError` with a user-facing message.
 */
function readValidatedFile(
  file: File,
  onSuccess: (text: string, fileName: string) => void,
  onError: (msg: string) => void
): void {
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    onError(`Unsupported file type "${ext}". Please use a .md, .txt, or .text file.`)
    return
  }
  if (file.size > MAX_FILE_SIZE) {
    onError(
      `File is too large (${(file.size / 1_048_576).toFixed(1)} MB). Maximum allowed size is 1 MB.`
    )
    return
  }
  const reader = new FileReader()
  reader.onload = (ev) => {
    const text = ev.target?.result
    if (typeof text === 'string') onSuccess(text, file.name)
  }
  reader.onerror = () => {
    onError('Could not read the file. It may be corrupted or inaccessible.')
  }
  reader.readAsText(file)
}

/** Handles Markdown file import (declarative file input) and export (anchor download). */
export function useFileImportExport(
  value: string,
  onChange: (v: string) => void,
  addToast: (msg: string, type: ToastType) => void
): FileImportExportState {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleImport = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      // Reset so the same file can be re-selected in subsequent imports
      e.target.value = ''
      if (!file) return
      readValidatedFile(
        file,
        (text) => onChange(text),
        (msg) => addToast(msg, 'error')
      )
    },
    [onChange, addToast]
  )

  const handleExport = useCallback(() => {
    // Prepend UTF-8 BOM (\uFEFF) so Windows Notepad and Excel recognise the
    // encoding correctly — without it, non-ASCII characters may display as mojibake.
    const blob = new Blob(['\uFEFF', value], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    // Security: filename is hardcoded to avoid path-traversal risks if the
    // imported filename were ever passed through here.
    a.download = 'document.md'
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [value])

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    // Only clear when leaving the drop zone entirely (not entering a child element)
    const related = e.relatedTarget
    if (!(related instanceof Node) || !e.currentTarget.contains(related)) {
      setIsDragging(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (!file) return
      readValidatedFile(
        file,
        (text, fileName) => {
          onChange(text)
          addToast(`Imported "${fileName}"`, 'success')
        },
        (msg) => addToast(msg, 'error')
      )
    },
    [onChange, addToast]
  )

  return {
    fileInputRef,
    handleImport,
    handleFileChange,
    handleExport,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    isDragging,
  }
}
