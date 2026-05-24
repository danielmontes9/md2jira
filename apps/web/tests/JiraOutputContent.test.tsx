import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SettingsProvider } from '../src/context/SettingsContext.js'
import { JiraOutputContent } from '../src/components/jira-output/JiraOutputContent.js'

function renderWithSettings(ui: React.ReactElement) {
  return render(<SettingsProvider>{ui}</SettingsProvider>)
}

const baseProps = {
  value: '',
  editor: null,
  canEdit: false,
  editMode: false,
}

describe('JiraOutputContent — code view', () => {
  it('renders ADF JSON code region when format=adf and viewMode=code', () => {
    renderWithSettings(
      <JiraOutputContent {...baseProps} format="adf" viewMode="code" value='{"type":"doc"}' />
    )
    expect(screen.getByRole('region', { name: 'ADF JSON code' })).toBeInTheDocument()
  })

  it('renders wiki markup code region when format=wiki and viewMode=code', () => {
    renderWithSettings(
      <JiraOutputContent {...baseProps} format="wiki" viewMode="code" value="h1. Hello" />
    )
    expect(screen.getByRole('region', { name: 'Wiki markup code' })).toBeInTheDocument()
  })

  it('displays the value as text content in code view', () => {
    renderWithSettings(
      <JiraOutputContent {...baseProps} format="wiki" viewMode="code" value="h1. Hello" />
    )
    const pre = screen.getByRole('region', { name: 'Wiki markup code' })
    expect(pre.textContent).toContain('h1. Hello')
  })

  it('renders without crashing when value is empty', () => {
    renderWithSettings(<JiraOutputContent {...baseProps} format="adf" viewMode="code" value="" />)
    expect(screen.getByRole('region', { name: 'ADF JSON code' })).toBeInTheDocument()
  })
})

describe('JiraOutputContent — ADF preview', () => {
  it('renders the editor content area for adf preview', () => {
    renderWithSettings(<JiraOutputContent {...baseProps} format="adf" viewMode="preview" />)
    expect(screen.getByRole('textbox', { name: /jira content editor/i })).toBeInTheDocument()
  })

  it('is aria-readonly when not in edit mode', () => {
    renderWithSettings(
      <JiraOutputContent
        {...baseProps}
        format="adf"
        viewMode="preview"
        canEdit={true}
        editMode={false}
      />
    )
    const editor = screen.getByRole('textbox', { name: /jira content editor/i })
    expect(editor).toHaveAttribute('aria-readonly', 'true')
  })

  it('is not aria-readonly when in edit mode', () => {
    renderWithSettings(
      <JiraOutputContent
        {...baseProps}
        format="adf"
        viewMode="preview"
        canEdit={true}
        editMode={true}
      />
    )
    const editor = screen.getByRole('textbox', { name: /jira content editor/i })
    expect(editor).toHaveAttribute('aria-readonly', 'false')
  })

  it('renders without crashing when editor is null', () => {
    renderWithSettings(
      <JiraOutputContent {...baseProps} format="adf" viewMode="preview" editor={null} />
    )
    expect(screen.getByRole('textbox', { name: /jira content editor/i })).toBeInTheDocument()
  })
})

describe('JiraOutputContent — wiki preview', () => {
  it('renders wiki markup preview region', () => {
    renderWithSettings(
      <JiraOutputContent {...baseProps} format="wiki" viewMode="preview" value="h1. Hello" />
    )
    expect(screen.getByRole('region', { name: 'Wiki markup preview' })).toBeInTheDocument()
  })

  it('displays formatted wiki content as text', () => {
    renderWithSettings(
      <JiraOutputContent {...baseProps} format="wiki" viewMode="preview" value="h1. Hello" />
    )
    const pre = screen.getByRole('region', { name: 'Wiki markup preview' })
    expect(pre.textContent).toContain('h1. Hello')
  })

  it('renders without crashing when value is empty', () => {
    renderWithSettings(
      <JiraOutputContent {...baseProps} format="wiki" viewMode="preview" value="" />
    )
    expect(screen.getByRole('region', { name: 'Wiki markup preview' })).toBeInTheDocument()
  })
})
