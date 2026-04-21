import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CopyEditGroup } from '../src/components/jira-output/CopyEditGroup.js'
import { JiraOutputHeader } from '../src/components/jira-output/JiraOutputHeader.js'

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

describe('JiraOutputHeader — format toggle', () => {
  const baseProps = {
    viewMode: 'preview' as const,
    isPending: false,
    onFormatChange: noop,
    onViewModeChange: noop,
    canEdit: false,
    editMode: false,
    copied: false,
    onCopy: noop,
    onToggleEdit: noop,
  }

  it('format toggle is rendered as a radiogroup', () => {
    render(<JiraOutputHeader format="adf" {...baseProps} />)
    expect(screen.getByRole('radiogroup', { name: /output format/i })).toBeInTheDocument()
  })

  it('"Jira Cloud" radio is checked and "Wiki Markup" is unchecked when format is "adf"', () => {
    render(<JiraOutputHeader format="adf" {...baseProps} />)
    expect(screen.getByRole('radio', { name: 'Jira Cloud' })).toHaveAttribute(
      'aria-checked',
      'true'
    )
    expect(screen.getByRole('radio', { name: 'Wiki Markup' })).toHaveAttribute(
      'aria-checked',
      'false'
    )
  })

  it('"Wiki Markup" radio is checked and "Jira Cloud" is unchecked when format is "wiki"', () => {
    render(<JiraOutputHeader format="wiki" {...baseProps} />)
    expect(screen.getByRole('radio', { name: 'Wiki Markup' })).toHaveAttribute(
      'aria-checked',
      'true'
    )
    expect(screen.getByRole('radio', { name: 'Jira Cloud' })).toHaveAttribute(
      'aria-checked',
      'false'
    )
  })

  it('clicking "Wiki Markup" radio calls onFormatChange("wiki")', () => {
    const onFormatChange = vi.fn()
    render(<JiraOutputHeader format="adf" {...baseProps} onFormatChange={onFormatChange} />)
    fireEvent.click(screen.getByRole('radio', { name: 'Wiki Markup' }))
    expect(onFormatChange).toHaveBeenCalledWith('wiki')
  })

  it('clicking "Jira Cloud" radio calls onFormatChange("adf")', () => {
    const onFormatChange = vi.fn()
    render(<JiraOutputHeader format="wiki" {...baseProps} onFormatChange={onFormatChange} />)
    fireEvent.click(screen.getByRole('radio', { name: 'Jira Cloud' }))
    expect(onFormatChange).toHaveBeenCalledWith('adf')
  })

  it('view-mode toggle is rendered as a radiogroup when format is "adf"', () => {
    render(<JiraOutputHeader format="adf" {...baseProps} />)
    expect(screen.getByRole('radiogroup', { name: /view mode/i })).toBeInTheDocument()
  })

  it('view-mode toggle is not rendered when format is "wiki"', () => {
    render(<JiraOutputHeader format="wiki" {...baseProps} />)
    expect(screen.queryByRole('radiogroup', { name: /view mode/i })).not.toBeInTheDocument()
  })
})
