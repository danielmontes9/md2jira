import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Header } from '../src/components/Header.js'
import { ShortcutsModal } from '../src/components/ShortcutsModal.js'
import { InfoModal } from '../src/components/InfoModal.js'

// jsdom stubs
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockReturnValue({ matches: false }),
})

describe('Header', () => {
  it('renders the page title', () => {
    render(<Header theme="light" onToggleTheme={vi.fn()} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('md2jira-previewer')
  })

  it('has a theme toggle button', () => {
    render(<Header theme="light" onToggleTheme={vi.fn()} />)
    expect(screen.getByRole('button', { name: /switch to dark mode/i })).toBeInTheDocument()
  })

  it('calls onToggleTheme when theme button is clicked', () => {
    const onToggle = vi.fn()
    render(<Header theme="light" onToggleTheme={onToggle} />)
    fireEvent.click(screen.getByRole('button', { name: /switch to dark mode/i }))
    expect(onToggle).toHaveBeenCalledOnce()
  })

  it('has an about button that triggers lazy InfoModal', async () => {
    render(<Header theme="light" onToggleTheme={vi.fn()} />)
    const aboutBtn = screen.getByRole('button', { name: /about this project/i })
    expect(aboutBtn).toBeInTheDocument()
    fireEvent.click(aboutBtn)
    // The InfoModal is lazy-loaded; wait for it to appear
    expect(await screen.findByText('md2jira')).toBeInTheDocument()
  })

  it('GitHub link opens in new tab with rel noopener', () => {
    render(<Header theme="light" onToggleTheme={vi.fn()} />)
    const link = screen.getByRole('link', { name: /view project on github/i })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })
})

describe('InfoModal', () => {
  it('renders with accessible title', () => {
    render(<InfoModal onClose={vi.fn()} />)
    expect(screen.getByText('md2jira')).toBeInTheDocument()
  })

  it('has a close button', () => {
    render(<InfoModal onClose={vi.fn()} />)
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<InfoModal onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})

describe('ShortcutsModal', () => {
  it('renders the title', () => {
    render(<ShortcutsModal onClose={vi.fn()} />)
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument()
  })

  it('displays shortcut groups', () => {
    render(<ShortcutsModal onClose={vi.fn()} />)
    expect(screen.getByText('Formatting')).toBeInTheDocument()
    expect(screen.getByText('Structure')).toBeInTheDocument()
    expect(screen.getByText('Lines')).toBeInTheDocument()
    expect(screen.getByText('Editor')).toBeInTheDocument()
  })

  it('has a close button', () => {
    render(<ShortcutsModal onClose={vi.fn()} />)
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<ShortcutsModal onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('shows individual shortcuts', () => {
    render(<ShortcutsModal onClose={vi.fn()} />)
    expect(screen.getByText('Bold')).toBeInTheDocument()
    expect(screen.getByText('Italic')).toBeInTheDocument()
    expect(screen.getByText('Move line up')).toBeInTheDocument()
  })
})
