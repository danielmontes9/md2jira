import '@testing-library/jest-dom'

// jsdom does not implement HTMLDialogElement.showModal() / close().
// Stub them so tests that render <Modal> (which calls showModal) don't throw.
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '')
  }
}
if (!HTMLDialogElement.prototype.close) {
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open')
  }
}

// jsdom does not implement Web Workers. Provide a minimal stub so App.tsx
// and any component that uses `new Worker(...)` doesn't throw in unit tests.
// The stub is synchronous: onmessage is never called, so tests that render
// <App> will see previewHtml stay as '' (the initial state), which is fine for
// snapshot / integration unit tests.
// ProseMirror/TipTap calls textRange(...).getClientRects() during rendering.
// jsdom does not implement this method on Range, causing an uncaught TypeError
// that Vitest reports as "Errors: 1" even though all tests pass.
// Stub it globally so TipTap-based tests run cleanly.
if (!Range.prototype.getClientRects) {
  Range.prototype.getClientRects = () =>
    ({
      length: 0,
      item: () => null,
      [Symbol.iterator]: function* () {},
    }) as unknown as DOMRectList
}
if (!Range.prototype.getBoundingClientRect) {
  Range.prototype.getBoundingClientRect = () =>
    ({
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }) as DOMRect
}

if (typeof Worker === 'undefined') {
  // @ts-expect-error — intentional minimal stub for jsdom
  global.Worker = class MockWorker {
    onmessage: ((e: MessageEvent) => void) | null = null
    addEventListener() {}
    removeEventListener() {}
    postMessage() {}
    terminate() {}
  }
}
