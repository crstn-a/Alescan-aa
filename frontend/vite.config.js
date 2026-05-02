// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false,          // we use our own public/manifest.json
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,webp}'],
        // Don't cache API calls — always fresh from backend
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/scan/, /^\/prices/, /^\/admin/],
        runtimeCaching: [
          {
            // Cache price data for 1 hour (SRP doesn't change mid-day)
            urlPattern: /\/prices/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'prices-cache',
              expiration: { maxAgeSeconds: 3600 },
            },
          },
        ],
      },
    }),
  ],

  // Dev server proxy — keeps CORS clean during local development
  server: {
    proxy: {
      '/scan':   'https://alescan.up.railway.app/scan',
      '/prices': 'https://alescan.up.railway.app/prices',
      '/admin':  'https://alescan.up.railway.app/admin',
      '/health': 'https://alescan.up.railway.app/health',
    },
  },

  build: {
    // Produce smaller chunks for faster PWA load on mobile
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
})