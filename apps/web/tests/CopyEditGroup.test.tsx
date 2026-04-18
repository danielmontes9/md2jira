import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CopyEditGroup } from '../src/components/jira-output/CopyEditGroup.js'

const noop = () => {}

describe('CopyEditGroup', () => {
  it('renders "Copy for Jira" when copied is false', () => {
    render(
      <CopyEditGroup
        copied={false}
        editMode={false}
        canEdit={false}
        format="adf"
        onCopy={noop}
        onToggleEdit={noop}
      />
    )
    expect(screen.getByRole('button', { name: /copy for jira/i })).toBeInTheDocument()
  })

  it('renders "Copied!" when copied is true', () => {
    render(
      <CopyEditGroup
        copied={true}
        editMode={false}
        canEdit={false}
        format="adf"
        onCopy={noop}
        onToggleEdit={noop}
      />
    )
    expect(screen.getByRole('button', { name: /copied!/i })).toBeInTheDocument()
  })

  it('does NOT render the edit button when canEdit is false', () => {
    render(
      <CopyEditGroup
        copied={false}
        editMode={false}
        canEdit={false}
        format="adf"
        onCopy={noop}
        onToggleEdit={noop}
      />
    )
    expect(screen.queryByRole('button', { name: /edit|view/i })).toBeNull()
  })

  it('renders the edit button when canEdit is true', () => {
    render(
      <CopyEditGroup
        copied={false}
        editMode={false}
        canEdit={true}
        format="adf"
        onCopy={noop}
        onToggleEdit={noop}
      />
    )
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
  })

  it('shows "View" text when editMode is true', () => {
    render(
      <CopyEditGroup
        copied={false}
        editMode={true}
        canEdit={true}
        format="adf"
        onCopy={noop}
        onToggleEdit={noop}
      />
    )
    expect(screen.getByRole('button', { name: /view/i })).toBeInTheDocument()
  })

  it('edit button has aria-pressed reflecting editMode', () => {
    const { rerender } = render(
      <CopyEditGroup
        copied={false}
        editMode={false}
        canEdit={true}
        format="adf"
        onCopy={noop}
        onToggleEdit={noop}
      />
    )
    expect(screen.getByRole('button', { name: /edit/i })).toHaveAttribute('aria-pressed', 'false')

    rerender(
      <CopyEditGroup
        copied={false}
        editMode={true}
        canEdit={true}
        format="adf"
        onCopy={noop}
        onToggleEdit={noop}
      />
    )
    expect(screen.getByRole('button', { name: /view/i })).toHaveAttribute('aria-pressed', 'true')
  })

  it('copy button has aria-live="polite" for screen-reader announcements', () => {
    render(
      <CopyEditGroup
        copied={false}
        editMode={false}
        canEdit={false}
        format="adf"
        onCopy={noop}
        onToggleEdit={noop}
      />
    )
    expect(screen.getByRole('button', { name: /copy for jira/i })).toHaveAttribute(
      'aria-live',
      'polite'
    )
  })

  it('calls onCopy when copy button is clicked', async () => {
    const onCopy = vi.fn()
    render(
      <CopyEditGroup
        copied={false}
        editMode={false}
        canEdit={false}
        format="adf"
        onCopy={onCopy}
        onToggleEdit={noop}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /copy for jira/i }))
    expect(onCopy).toHaveBeenCalledOnce()
  })

  it('calls onToggleEdit when edit button is clicked', async () => {
    const onToggleEdit = vi.fn()
    render(
      <CopyEditGroup
        copied={false}
        editMode={false}
        canEdit={true}
        format="adf"
        onCopy={noop}
        onToggleEdit={onToggleEdit}
      />
    )
    await userEvent.click(screen.getByRole('button', { name: /edit/i }))
    expect(onToggleEdit).toHaveBeenCalledOnce()
  })

  it('copy button title reflects ADF format', () => {
    render(
      <CopyEditGroup
        copied={false}
        editMode={false}
        canEdit={false}
        format="adf"
        onCopy={noop}
        onToggleEdit={noop}
      />
    )
    expect(screen.getByRole('button', { name: /copy for jira/i })).toHaveAttribute(
      'title',
      'Copy as rich text for Jira Cloud'
    )
  })

  it('copy button title reflects Wiki format', () => {
    render(
      <CopyEditGroup
        copied={false}
        editMode={false}
        canEdit={false}
        format="wiki"
        onCopy={noop}
        onToggleEdit={noop}
      />
    )
    expect(screen.getByRole('button', { name: /copy for jira/i })).toHaveAttribute(
      'title',
      'Copy Wiki Markup to clipboard'
    )
  })
})
