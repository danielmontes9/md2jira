import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useEditorSelection } from '../src/hooks/useEditorSelection.js'

describe('useEditorSelection', () => {
  const makeDiv = (): HTMLDivElement => document.createElement('div')

  beforeEach(() => {
    vi.restoreAllMocks()
    // jsdom doesn't implement queryCommandValue — stub it
    if (typeof document.queryCommandValue !== 'function') {
      document.queryCommandValue = vi.fn().mockReturnValue('p')
    } else {
      vi.spyOn(document, 'queryCommandValue').mockReturnValue('p')
    }
    if (typeof document.queryCommandState !== 'function') {
      document.queryCommandState = vi.fn().mockReturnValue(false)
    } else {
      vi.spyOn(document, 'queryCommandState').mockReturnValue(false)
    }
  })

  it('initializes activeBlock to "p"', () => {
    const ref = { current: makeDiv() }
    const { result } = renderHook(() => useEditorSelection(ref))
    expect(result.current.activeBlock).toBe('p')
  })

  it('initializes activeFormats as empty Set', () => {
    const ref = { current: makeDiv() }
    const { result } = renderHook(() => useEditorSelection(ref))
    expect(result.current.activeFormats.size).toBe(0)
  })

  it('saveRange does not throw when no active selection', () => {
    const ref = { current: makeDiv() }
    const { result } = renderHook(() => useEditorSelection(ref))
    expect(() => act(() => result.current.saveRange())).not.toThrow()
  })

  it('restoreRange does not throw when no saved range exists', () => {
    const ref = { current: makeDiv() }
    const { result } = renderHook(() => useEditorSelection(ref))
    expect(() => act(() => result.current.restoreRange())).not.toThrow()
  })

  it('onFirstInteraction fires exactly once across multiple saveRange calls', () => {
    const div = makeDiv()
    document.body.appendChild(div)
    const ref = { current: div }
    const onFirst = vi.fn()

    // Make the editor contain the anchor node so updateSelectionState proceeds.
    const range = document.createRange()
    range.selectNode(div)
    vi.spyOn(window, 'getSelection').mockReturnValue({
      rangeCount: 1,
      anchorNode: div,
      getRangeAt: () => range,
      removeAllRanges: vi.fn(),
      addRange: vi.fn(),
    } as unknown as Selection)

    const { result } = renderHook(() => useEditorSelection(ref, onFirst))

    act(() => result.current.saveRange())
    act(() => result.current.saveRange())
    act(() => result.current.saveRange())

    expect(onFirst).toHaveBeenCalledTimes(1)
    document.body.removeChild(div)
  })

  it('onFirstInteraction is NOT called when the selection is outside the editor', () => {
    const outside = document.createElement('span')
    document.body.appendChild(outside)
    const ref = { current: makeDiv() }
    const onFirst = vi.fn()

    vi.spyOn(window, 'getSelection').mockReturnValue({
      rangeCount: 1,
      anchorNode: outside,
      getRangeAt: () => document.createRange(),
      removeAllRanges: vi.fn(),
      addRange: vi.fn(),
    } as unknown as Selection)

    const { result } = renderHook(() => useEditorSelection(ref, onFirst))
    act(() => result.current.saveRange())

    expect(onFirst).not.toHaveBeenCalled()
    document.body.removeChild(outside)
  })
})
