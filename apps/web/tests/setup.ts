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
