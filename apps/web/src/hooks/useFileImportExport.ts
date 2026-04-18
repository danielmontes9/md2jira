import { useRef, useCallback, type ChangeEvent, type RefObject } from 'react'
import type { ToastType } from '../components/Toast.js'

export interface FileImportExportState {
  fileInputRef: RefObject<HTMLInputElement>
  handleImport: () => void
  handleFileChange: (e: ChangeEvent<HTMLInputElement>) => void
  handleExport: () => void
}

/** Handles Markdown file import (declarative file input) and export (anchor download). */
export function useFileImportExport(
  value: string,
  onChange: (v: string) => void,
  addToast: (msg: string, type: ToastType) => void
): FileImportExportState {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImport = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      // Reset so the same file can be re-selected in subsequent imports
      e.target.value = ''
      if (!file) return
      const allowed = ['.md', '.txt', '.text']
      const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
      if (!allowed.includes(ext)) {
        addToast(
          `Unsupported file type "${ext}". Please import a .md, .txt, or .text file.`,
          'error'
        )
        return
      }
      const reader = new FileReader()
      reader.onload = (ev) => {
        const text = ev.target?.result
        if (typeof text === 'string') onChange(text)
      }
      reader.readAsText(file)
    },
    [onChange, addToast]
  )

  const handleExport = useCallback(() => {
    const blob = new Blob([value], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'document.md'
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [value])

  return { fileInputRef, handleImport, handleFileChange, handleExport }
}
