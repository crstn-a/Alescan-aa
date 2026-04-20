import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false,        // we use our own public/manifest.json
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg}'],
        runtimeCaching: [{
          urlPattern: /^https:\/\/.*\/prices/,
          handler: 'NetworkFirst',   // prices: network first, fallback cache
        }],
      },
    }),
  ],

  server: {
    proxy: {
      '/scan':   'http://localhost:8000',
      '/prices': 'http://localhost:8000',
      '/admin':  'http://localhost:8000',
      '/health': 'http://localhost:8000',
    },
    // https: true   ← uncomment if you need real camera on LAN devices
  },
})