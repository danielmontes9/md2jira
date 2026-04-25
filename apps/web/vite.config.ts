import { defineConfig, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'
import { fileURLToPath } from 'node:url'

/**
 * Replaces the canonical URL in index.html at build time when VITE_CANONICAL_URL
 * is set. Uses the `data-vite-canonical` attribute as a stable selector so the
 * replacement is opt-in and never accidentally clobbers other <link> tags.
 *
 * Usage: VITE_CANONICAL_URL=https://example.com/myapp pnpm build
 */
function canonicalUrlPlugin(): PluginOption {
  const canonicalUrl = process.env.VITE_CANONICAL_URL
  if (!canonicalUrl) return null
  return {
    name: 'canonical-url',
    transformIndexHtml(html: string): string {
      return html.replace(
        /(<link rel="canonical" href=")[^"]*(")([^/]* data-vite-canonical \/>)/,
        `$1${canonicalUrl}$2$3`
      )
    },
  }
}

export default defineConfig({
  plugins: [
    canonicalUrlPlugin(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'favicon.ico',
        'icon.svg',
        'apple-touch-icon-180x180.png',
        'pwa-*.png',
        'maskable-icon-*.png',
      ],
      manifest: {
        name: 'md2jira Converter',
        short_name: 'md2jira',
        description: 'Convert Markdown to Jira Wiki Markup instantly',
        theme_color: '#1d4ed8',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'pwa-64x64.png',
            sizes: '64x64',
            type: 'image/png',
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // App-shell navigation requests — always serve latest from network,
            // fall back to cache when offline.
            urlPattern: ({ request }: { request: Request }) => request.mode === 'navigate',
            handler: 'NetworkFirst' as const,
            options: { cacheName: 'app-shell', networkTimeoutSeconds: 5 },
          },
          {
            // Buy Me a Coffee CDN image — cached for 7 days.
            urlPattern: /^https:\/\/cdn\.buymeacoffee\.com\//,
            handler: 'CacheFirst' as const,
            options: {
              cacheName: 'bmac-assets',
              expiration: { maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
        ],
      },
    }),
    // Bundle size visualizer — generates stats.html in dist/ when ANALYZE=true.
    // Run: ANALYZE=true pnpm --filter web build
    ...(process.env.ANALYZE === 'true'
      ? [
          visualizer({
            filename: 'dist/stats.html',
            open: false,
            gzipSize: true,
            brotliSize: true,
          }) as unknown as PluginOption,
        ]
      : []),
  ],
  base: process.env.VITE_BASE_URL ?? '/',
  resolve: {
    alias: {
      'md2jira-core': fileURLToPath(new URL('../../packages/core/src/index.ts', import.meta.url)),
    },
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks(id) {
          // All @tiptap/* packages — including all 14 extensions — go into one
          // lazy chunk. Without this, Rollup scatters them across the main bundle
          // and the react-vendor chunk, inflating the initial download.
          if (id.includes('@tiptap/')) return 'tiptap'
          if (id.includes('dompurify')) return 'dompurify'
          if (id.includes('react-dom') || id.includes('react/')) return 'react-vendor'
        },
      },
    },
  },
})
