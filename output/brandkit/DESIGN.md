# md2jira design system

This directory preserves the approved visual identity and its original images. These files are design references; the application does not load them at runtime.

## Approved references

- [Identity concept board](md2jira-brand-concept.png): symbol, wordmark, palette, and examples of brand applications.
- [Original transparent logo](md2jira-logo-transparent.png): horizontal logo artwork on a transparent background.

Keep both originals and their filenames. Use the board as visual direction, not as a specification of application features or an exact screenshot of the interface.

## Meaning and logo

The symbol combines the **M of Markdown with a rightward conversion arrow** in one geometric shape. It represents transferring document structure between formats. The guiding phrase is: “Cambia el formato. Conserva la estructura.”

- Write the brand as **md2jira**, in lowercase, with the numeral **2** highlighted in blue.
- Preserve the symbol's proportions and integrated arrow. Do not stretch, redraw, or add effects to the mark independently across applications.
- Use the existing vector geometry in `apps/web/public/icon.svg`, `apps/web/public/favicon.svg`, and `apps/web/src/components/Header.tsx` for production rendering. The PNG originals are raster references.
- Use a white symbol on blue for app icons. The header uses a blue symbol with dark lettering in light mode and light lettering in dark mode.

## Color

| Role          | Approved reference |
| ------------- | ------------------ |
| Primary blue  | `#1D4ED8`          |
| Ink           | `#111318`          |
| Light surface | `#F5F6F8`          |
| White         | `#FFFFFF`          |

The interface retains its existing Tailwind neutral surfaces and text colors. In the header, `blue-700` is the light-mode accent and `blue-400` is the dark-mode accent. Preserve those existing theme adaptations and readable contrast; do not force every interface color to match the presentation board.

## Typography and interface

- Follow the bold sans-serif wordmark direction shown in the originals. No specific font family is established by the generated artwork; the current header uses the application's existing sans-serif stack, bold weight, and tight tracking.
- Reserve monospace for Markdown, code, and syntax examples.
- Keep the converter focused on its input and output, with restrained blue accents, clear alignment, and generous whitespace.
- Reuse existing components, spacing, controls, and responsive behavior. Branding work alone does not authorize changing functionality or rebuilding the layout.
- Keep the header readable on mobile and desktop in both themes. Decorative logo geometry must not add duplicate accessible names.

## Icons and documentation images

- The production icon source is `apps/web/public/icon.svg`; icon generation is configured in `pwa-assets.config.ts`.
- Regenerate the existing PNG and ICO files with `pnpm exec pwa-assets-generator --config pwa-assets.config.ts` from the repository root when the source changes.
- Preserve the opaque blue background for Apple and Android maskable icons and keep the symbol inside the maskable safe zone. Keep manifest and icon URLs compatible with deployments under `/md2jira/`.
- Preserve the three existing filenames in `.github/assets` when updating documentation imagery.
- Capture the actual application for the main overview image. Wait for the original Buy Me a Coffee image to load; do not capture its fallback button as if it were the original artwork.
- Before/after illustrations must retain accurate Markdown and converted output and must not invent product features.

## Verification

For future visual changes, inspect the rendered result on desktop and mobile in light and dark themes. For icon changes, check generated sizes, asset URLs, and maskable cropping. Distinguish browser emulation from installation tests on physical Android or iOS devices.
