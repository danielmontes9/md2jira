import { defineConfig, minimalPreset } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  preset: minimalPreset,
  images: ['apps/web/public/icon.svg'],
})
