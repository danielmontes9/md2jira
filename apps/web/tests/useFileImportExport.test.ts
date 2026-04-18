import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type React from 'react'
import { useFileImportExport } from '../src/hooks/useFileImportExport.js'
import type { ChangeEvent } from 'react'

describe('useFileImportExport', () => {
  const mockOnChange = vi.fn()
  const mockAddToast = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  it('returns a stable fileInputRef across renders', () => {
    const { result, rerender } = renderHook(() =>
      useFileImportExport('', mockOnChange, mockAddToast)
    )
    const ref = result.current.fileInputRef
    rerender()
    expect(result.current.fileInputRef).toBe(ref)
  })

  it('handleImport triggers click on the file input element', () => {
    const { result } = renderHook(() => useFileImportExport('', mockOnChange, mockAddToast))
    const mockClick = vi.fn()
    ;(result.current.fileInputRef as React.MutableRefObject<HTMLInputElement | null>).current = {
      click: mockClick,
    } as unknown as HTMLInputElement
    act(() => {
      result.current.handleImport()
    })
    expect(mockClick).toHaveBeenCalledOnce()
  })

  it('handleImport does nothing when fileInputRef.current is null', () => {
    const { result } = renderHook(() => useFileImportExport('', mockOnChange, mockAddToast))
    expect(() => act(() => result.current.handleImport())).not.toThrow()
  })

  it('handleFileChange rejects unsupported file extension with a toast', () => {
    const { result } = renderHook(() => useFileImportExport('', mockOnChange, mockAddToast))
    const mockFile = new File(['content'], 'document.pdf', { type: 'application/pdf' })
    const event = {
      target: { files: [mockFile], value: '' },
    } as unknown as ChangeEvent<HTMLInputElement>
    act(() => {
      result.current.handleFileChange(event)
    })
    expect(mockAddToast).toHaveBeenCalledWith(expect.stringContaining('.pdf'), 'error')
    expect(mockOnChange).not.toHaveBeenCalled()
  })

  it('handleFileChange does nothing when no file is present', () => {
    const { result } = renderHook(() => useFileImportExport('', mockOnChange, mockAddToast))
    const event = {
      target: { files: [], value: '' },
    } as unknown as ChangeEvent<HTMLInputElement>
    act(() => {
      result.current.handleFileChange(event)
    })
    expect(mockAddToast).not.toHaveBeenCalled()
    expect(mockOnChange).not.toHaveBeenCalled()
  })

  it('handleFileChange reads a valid .md file and calls onChange', async () => {
    const { result } = renderHook(() => useFileImportExport('', mockOnChange, mockAddToast))
    const content = '# Hello World'
    const mockFile = new File([content], 'test.md', { type: 'text/markdown' })
    const event = {
      target: { files: [mockFile], value: '' },
    } as unknown as ChangeEvent<HTMLInputElement>
    act(() => {
      result.current.handleFileChange(event)
    })
    await act(async () => {
      await new Promise<void>((resolve) => setTimeout(resolve, 50))
    })
    expect(mockOnChange).toHaveBeenCalledWith(content)
    expect(mockAddToast).not.toHaveBeenCalled()
  })

  it('handleFileChange accepts .txt files without showing a toast', async () => {
    const { result } = renderHook(() => useFileImportExport('', mockOnChange, mockAddToast))
    const content = 'plain text'
    const mockFile = new File([content], 'notes.txt', { type: 'text/plain' })
    const event = {
      target: { files: [mockFile], value: '' },
    } as unknown as ChangeEvent<HTMLInputElement>
    act(() => {
      result.current.handleFileChange(event)
    })
    await act(async () => {
      await new Promise<void>((resolve) => setTimeout(resolve, 50))
    })
    expect(mockOnChange).toHaveBeenCalledWith(content)
    expect(mockAddToast).not.toHaveBeenCalled()
  })

  it('handleExport creates a download anchor with filename document.md', () => {
    const createObjectURL = vi.fn(() => 'blob:test-url')
    const revokeObjectURL = vi.fn()
    global.URL.createObjectURL = createObjectURL
    global.URL.revokeObjectURL = revokeObjectURL

    const { result } = renderHook(() =>
      useFileImportExport('# My Content', mockOnChange, mockAddToast)
    )

    // Set up spies AFTER renderHook so internal createElement calls are unaffected
    const clickSpy = vi.fn()
    const mockAnchor = {
      href: '',
      download: '',
      style: { display: '' },
      click: clickSpy,
    } as unknown as HTMLAnchorElement
    vi.spyOn(document, 'createElement').mockReturnValueOnce(mockAnchor)
    vi.spyOn(document.body, 'appendChild').mockImplementationOnce((el) => el)
    vi.spyOn(document.body, 'removeChild').mockImplementationOnce((el) => el)

    act(() => {
      result.current.handleExport()
    })
    expect(createObjectURL).toHaveBeenCalled()
    expect(clickSpy).toHaveBeenCalledOnce()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:test-url')
    expect(mockAnchor.download).toBe('document.md')
  })
})
