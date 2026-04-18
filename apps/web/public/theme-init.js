// Theme initialisation — runs before React hydrates to prevent flash of unstyled content.
// This file is intentionally tiny and has no external dependencies.
var t = localStorage.getItem('theme')
if (t === 'dark' || (!t && matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.documentElement.classList.add('dark')
}
