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
