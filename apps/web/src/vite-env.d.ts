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
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
