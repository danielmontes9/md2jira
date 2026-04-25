/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Set to 'false' to disable the WYSIWYG editor and hide the Edit button in the output panel.
   * This is a tech-debt escape hatch while document.execCommand() is deprecated.
   * Recommended migration: TipTap (ProseMirror-based).
   * @default 'true'
   */
  readonly VITE_ENABLE_WYSIWYG?: string
  readonly VITE_BASE_URL?: string
  /**
   * When set, Core Web Vitals metrics are POSTed via navigator.sendBeacon to this URL.
   * Leave unset to disable production vitals reporting.
   */
  readonly VITE_VITALS_URL?: string
  /**
   * When set, render errors caught by ErrorBoundary are POSTed via navigator.sendBeacon
   * to this URL as JSON: { name, message, stack, componentStack, url, timestamp }.
   * Leave unset to disable production error reporting (errors still appear in console).
   */
  readonly VITE_ERROR_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
