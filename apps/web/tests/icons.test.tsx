import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import {
  IconClose,
  IconInfoCircle,
  IconAlertCircle,
  IconWarningTriangle,
  IconCheck,
  IconSun,
  IconMoon,
  IconLinkOff,
  IconLink,
  IconImage,
  IconCodeBrackets,
  IconUndo,
  IconRedo,
  IconAlertOcticon,
  IconCloseOcticon,
  IconExternalLink,
  IconGitHub,
  IconChevronDown,
  IconCheckFill,
  IconListBullet,
  IconListOrdered,
  IconListChecks,
  IconTable,
  IconSettings,
  IconPrint,
  IconHistory,
  IconSearch,
} from '../src/components/icons.js'
import type { ComponentType } from 'react'

// All icon components as (name, component) pairs for table-driven tests.
const ALL_ICONS: [string, ComponentType<{ className?: string }>][] = [
  ['IconClose', IconClose],
  ['IconInfoCircle', IconInfoCircle],
  ['IconAlertCircle', IconAlertCircle],
  ['IconWarningTriangle', IconWarningTriangle],
  ['IconCheck', IconCheck],
  ['IconSun', IconSun],
  ['IconMoon', IconMoon],
  ['IconLinkOff', IconLinkOff],
  ['IconLink', IconLink],
  ['IconImage', IconImage],
  ['IconCodeBrackets', IconCodeBrackets],
  ['IconUndo', IconUndo],
  ['IconRedo', IconRedo],
  ['IconAlertOcticon', IconAlertOcticon],
  ['IconCloseOcticon', IconCloseOcticon],
  ['IconExternalLink', IconExternalLink],
  ['IconGitHub', IconGitHub],
  ['IconChevronDown', IconChevronDown],
  ['IconCheckFill', IconCheckFill],
  ['IconListBullet', IconListBullet],
  ['IconListOrdered', IconListOrdered],
  ['IconListChecks', IconListChecks],
  ['IconTable', IconTable],
  ['IconSettings', IconSettings],
  ['IconPrint', IconPrint],
  ['IconHistory', IconHistory],
  ['IconSearch', IconSearch],
]

describe('Icon components — SVG rendering', () => {
  it('all 27 icon exports render an <svg> element', () => {
    for (const [name, Icon] of ALL_ICONS) {
      const { container, unmount } = render(<Icon />)
      expect(container.querySelector('svg'), `${name}: expected an <svg> element`).not.toBeNull()
      unmount()
    }
  })

  it('all icons carry aria-hidden="true" (decorative by default)', () => {
    for (const [name, Icon] of ALL_ICONS) {
      const { container, unmount } = render(<Icon />)
      expect(
        container.querySelector('svg'),
        `${name}: expected aria-hidden="true"`
      ).toHaveAttribute('aria-hidden', 'true')
      unmount()
    }
  })

  it('all icons accept a custom className override', () => {
    for (const [name, Icon] of ALL_ICONS) {
      const { container, unmount } = render(<Icon className="test-custom-class" />)
      expect(
        container.querySelector('svg'),
        `${name}: expected custom class to be applied`
      ).toHaveClass('test-custom-class')
      unmount()
    }
  })
})

describe('Icon components — default className', () => {
  it('IconClose defaults to h-4 w-4', () => {
    const { container } = render(<IconClose />)
    expect(container.querySelector('svg')).toHaveClass('h-4', 'w-4')
  })

  it('IconInfoCircle defaults to h-5 w-5', () => {
    const { container } = render(<IconInfoCircle />)
    expect(container.querySelector('svg')).toHaveClass('h-5', 'w-5')
  })

  it('IconSun defaults to h-5 w-5', () => {
    const { container } = render(<IconSun />)
    expect(container.querySelector('svg')).toHaveClass('h-5', 'w-5')
  })

  it('IconChevronDown defaults to h-2.5 w-2.5 shrink-0', () => {
    const { container } = render(<IconChevronDown />)
    const svg = container.querySelector('svg')!
    expect(svg).toHaveClass('h-2.5', 'w-2.5', 'shrink-0')
  })

  it('IconCheckFill defaults to h-3.5 w-3.5 shrink-0 text-blue-600', () => {
    const { container } = render(<IconCheckFill />)
    const svg = container.querySelector('svg')!
    expect(svg).toHaveClass('h-3.5', 'w-3.5', 'text-blue-600')
  })

  it('Octicon icons (IconAlertOcticon, IconCloseOcticon, etc.) render without crashing when no className is passed', () => {
    ;[IconAlertOcticon, IconCloseOcticon, IconExternalLink, IconGitHub].forEach((Icon, i) => {
      const { container, unmount } = render(<Icon />)
      expect(container.querySelector('svg'), `Octicon[${i}]: expected svg`).not.toBeNull()
      unmount()
    })
  })
})
