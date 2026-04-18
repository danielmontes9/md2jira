import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Modal } from '../src/components/Modal.js'

// jsdom doesn't implement HTMLDialogElement.showModal — stub it
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = vi.fn()
  HTMLDialogElement.prototype.close = vi.fn()
})

describe('Modal', () => {
  it('calls showModal on mount', () => {
    render(
      <Modal onClose={vi.fn()} ariaLabelledBy="title">
        <p>Content</p>
      </Modal>
    )
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled()
  })

  it('renders children', () => {
    render(
      <Modal onClose={vi.fn()} ariaLabelledBy="title">
        <p>Hello world</p>
      </Modal>
    )
    expect(screen.getByText('Hello world')).toBeTruthy()
  })

  it('applies aria-labelledby', () => {
    render(
      <Modal onClose={vi.fn()} ariaLabelledBy="my-title">
        <p>Content</p>
      </Modal>
    )
    const dialog = document.querySelector('dialog')
    expect(dialog?.getAttribute('aria-labelledby')).toBe('my-title')
  })

  it('calls onClose on backdrop click', () => {
    const onClose = vi.fn()
    render(
      <Modal onClose={onClose} ariaLabelledBy="title">
        <p>Content</p>
      </Modal>
    )
    const dialog = document.querySelector('dialog')!
    // Click on the dialog itself (backdrop), not a child
    fireEvent.click(dialog)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose when clicking children', () => {
    const onClose = vi.fn()
    render(
      <Modal onClose={onClose} ariaLabelledBy="title">
        <p>Content</p>
      </Modal>
    )
    fireEvent.click(screen.getByText('Content'))
    expect(onClose).not.toHaveBeenCalled()
  })

  it('calls onClose on cancel event (Escape)', () => {
    const onClose = vi.fn()
    render(
      <Modal onClose={onClose} ariaLabelledBy="title">
        <p>Content</p>
      </Modal>
    )
    const dialog = document.querySelector('dialog')!
    const cancelEvent = new Event('cancel', { bubbles: true })
    dialog.dispatchEvent(cancelEvent)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
