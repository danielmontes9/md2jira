import { useCallback } from 'react'
import type { ToastType } from '../components/Toast.js'

/** Handles Markdown file import (file picker) and export (anchor download). */
export function useFileImportExport(
  value: string,
  onChange: (v: string) => void,
  addToast: (msg: string, type: ToastType) => void
): { handleImport: () => void; handleExport: () => void } {
  const handleImport = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.md,.txt,.text,text/markdown,text/plain'
    input.style.display = 'none'
    input.onchange = () => {
      input.remove()
      const file = input.files?.[0]
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
      reader.onload = (e) => {
        const text = e.target?.result
        if (typeof text === 'string') onChange(text)
      }
      reader.readAsText(file)
    }
    document.body.appendChild(input)
    input.click()
  }, [onChange, addToast])

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

  return { handleImport, handleExport }
}
