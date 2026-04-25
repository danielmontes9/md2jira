import { describe, it, expect, vi, afterAll } from 'vitest'
import { IS_MAC, MOD_KEY } from '../src/utils/keyboard.js'

describe('keyboard.ts constants', () => {
  it('IS_MAC is a boolean', () => {
    expect(typeof IS_MAC).toBe('boolean')
  })

  it('MOD_KEY is the correct modifier for the current platform', () => {
    if (IS_MAC) {
      expect(MOD_KEY).toBe('\u2318')
    } else {
      expect(MOD_KEY).toBe('Ctrl')
    }
  })

  it('MOD_KEY is either "\u2318" or "Ctrl"', () => {
    expect(['\u2318', 'Ctrl']).toContain(MOD_KEY)
  })

  it('IS_MAC=true implies MOD_KEY="\u2318" (consistency)', () => {
    if (IS_MAC) expect(MOD_KEY).toBe('\u2318')
  })

  it('IS_MAC=false implies MOD_KEY="Ctrl" (consistency)', () => {
    if (!IS_MAC) expect(MOD_KEY).toBe('Ctrl')
  })
})

describe('keyboard.ts \u2013 module guard', () => {
  afterAll(() => {
    vi.unstubAllGlobals()
  })

  it('module can be re-imported without throwing', async () => {
    await expect(import('../src/utils/keyboard.js')).resolves.toBeDefined()
  })
})
