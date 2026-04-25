import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type React from 'react'
import { useFileImportExport } from '../src/hooks/useFileImportExport.js'
import type { ChangeEvent, DragEvent } from 'react'

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

  it('handleFileChange rejects files exceeding 1 MB with a toast', () => {
    const { result } = renderHook(() => useFileImportExport('', mockOnChange, mockAddToast))
    // Create a file stub > 1 MB
    const bigContent = new Uint8Array(1_048_577)
    const mockFile = new File([bigContent], 'huge.md', { type: 'text/markdown' })
    const event = {
      target: { files: [mockFile], value: '' },
    } as unknown as ChangeEvent<HTMLInputElement>
    act(() => {
      result.current.handleFileChange(event)
    })
    expect(mockAddToast).toHaveBeenCalledWith(expect.stringContaining('too large'), 'error')
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
    expect(mockAddToast).toHaveBeenCalledWith('Imported "test.md"', 'success')
  })

  it('handleFileChange accepts .txt files and shows a success toast', async () => {
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
    expect(mockAddToast).toHaveBeenCalledWith('Imported "notes.txt"', 'success')
  })

  it('handleFileChange shows an error toast when FileReader fires an error', async () => {
    const { result } = renderHook(() => useFileImportExport('', mockOnChange, mockAddToast))
    const mockFile = new File(['content'], 'test.md', { type: 'text/markdown' })

    // Stub FileReader so it fires onerror synchronously
    const OriginalFileReader = global.FileReader
    class ErrorFileReader {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      readAsText() {
        setTimeout(() => this.onerror?.(), 0)
      }
    }
    global.FileReader = ErrorFileReader as unknown as typeof FileReader

    const event = {
      target: { files: [mockFile], value: '' },
    } as unknown as ChangeEvent<HTMLInputElement>
    act(() => {
      result.current.handleFileChange(event)
    })
    await act(async () => {
      await new Promise<void>((resolve) => setTimeout(resolve, 50))
    })

    expect(mockAddToast).toHaveBeenCalledWith(expect.stringContaining('read'), 'error')
    expect(mockOnChange).not.toHaveBeenCalled()

    global.FileReader = OriginalFileReader
  })

  it('handleDragOver prevents default, sets dropEffect to copy, and marks isDragging', () => {
    const { result } = renderHook(() => useFileImportExport('', mockOnChange, mockAddToast))
    const mockPreventDefault = vi.fn()
    const mockEvent = {
      preventDefault: mockPreventDefault,
      dataTransfer: { dropEffect: '' },
    } as unknown as DragEvent<HTMLElement>
    act(() => {
      result.current.handleDragOver(mockEvent)
    })
    expect(mockPreventDefault).toHaveBeenCalled()
    expect((mockEvent.dataTransfer as { dropEffect: string }).dropEffect).toBe('copy')
    expect(result.current.isDragging).toBe(true)
  })

  it('handleDragLeave clears isDragging when relatedTarget is outside the drop zone', () => {
    const { result } = renderHook(() => useFileImportExport('', mockOnChange, mockAddToast))
    // First, enter the drag zone
    const enterEvent = {
      preventDefault: vi.fn(),
      dataTransfer: { dropEffect: '' },
    } as unknown as DragEvent<HTMLElement>
    act(() => {
      result.current.handleDragOver(enterEvent)
    })
    expect(result.current.isDragging).toBe(true)

    // Leave — relatedTarget is null (outside the drop zone entirely)
    const leaveEvent = {
      preventDefault: vi.fn(),
      relatedTarget: null,
      currentTarget: { contains: () => false },
    } as unknown as DragEvent<HTMLElement>
    act(() => {
      result.current.handleDragLeave(leaveEvent)
    })
    expect(result.current.isDragging).toBe(false)
  })

  it('handleDragLeave keeps isDragging true when relatedTarget is inside the drop zone', () => {
    const { result } = renderHook(() => useFileImportExport('', mockOnChange, mockAddToast))
    const enterEvent = {
      preventDefault: vi.fn(),
      dataTransfer: { dropEffect: '' },
    } as unknown as DragEvent<HTMLElement>
    act(() => {
      result.current.handleDragOver(enterEvent)
    })
    expect(result.current.isDragging).toBe(true)

    // relatedTarget IS a Node inside the drop zone — must NOT clear isDragging
    const childNode = document.createElement('span')
    const containerNode = document.createElement('div')
    containerNode.appendChild(childNode)
    const leaveEvent = {
      preventDefault: vi.fn(),
      relatedTarget: childNode,
      currentTarget: containerNode,
    } as unknown as DragEvent<HTMLElement>
    act(() => {
      result.current.handleDragLeave(leaveEvent)
    })
    // isDragging must remain true because we moved into a child element
    expect(result.current.isDragging).toBe(true)
  })

  it('handleDrop reads a valid dropped .md file and calls onChange', async () => {
    const { result } = renderHook(() => useFileImportExport('', mockOnChange, mockAddToast))
    const content = '# Dropped'
    const mockFile = new File([content], 'dropped.md', { type: 'text/markdown' })
    const dropEvent = {
      preventDefault: vi.fn(),
      dataTransfer: { files: [mockFile] },
    } as unknown as DragEvent<HTMLElement>
    act(() => {
      result.current.handleDrop(dropEvent)
    })
    await act(async () => {
      await new Promise<void>((resolve) => setTimeout(resolve, 50))
    })
    expect(mockOnChange).toHaveBeenCalledWith(content)
    expect(mockAddToast).toHaveBeenCalledWith('Imported "dropped.md"', 'success')
    expect(result.current.isDragging).toBe(false)
  })

  it('handleDrop rejects a dropped file with an unsupported extension', () => {
    const { result } = renderHook(() => useFileImportExport('', mockOnChange, mockAddToast))
    const mockFile = new File(['data'], 'image.png', { type: 'image/png' })
    const dropEvent = {
      preventDefault: vi.fn(),
      dataTransfer: { files: [mockFile] },
    } as unknown as DragEvent<HTMLElement>
    act(() => {
      result.current.handleDrop(dropEvent)
    })
    expect(mockAddToast).toHaveBeenCalledWith(expect.stringContaining('.png'), 'error')
    expect(mockOnChange).not.toHaveBeenCalled()
  })

  it('handleDrop does nothing when dataTransfer has no files', () => {
    const { result } = renderHook(() => useFileImportExport('', mockOnChange, mockAddToast))
    const dropEvent = {
      preventDefault: vi.fn(),
      dataTransfer: { files: [] },
    } as unknown as DragEvent<HTMLElement>
    act(() => {
      result.current.handleDrop(dropEvent)
    })
    expect(mockAddToast).not.toHaveBeenCalled()
    expect(mockOnChange).not.toHaveBeenCalled()
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
