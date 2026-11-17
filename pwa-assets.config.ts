import { defineConfig, minimalPreset } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  preset: {
    ...minimalPreset,
    maskable: {
      ...minimalPreset.maskable,
      padding: 0,
      resizeOptions: { background: '#1d4ed8' },
    },
    apple: {
      ...minimalPreset.apple,
      padding: 0,
      resizeOptions: { background: '#1d4ed8' },
    },
  },
  images: ['apps/web/public/icon.svg'],
})
