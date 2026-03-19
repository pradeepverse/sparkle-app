import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// IMPORTANT: 'sparkle-app' must match your exact GitHub repository name.
// GitHub Pages serves from https://<username>.github.io/<repo-name>/
export default defineConfig({
  base: '/sparkle-app/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'Sparkle',
        short_name: 'Sparkle',
        description: 'A magical habit tracker for kids',
        theme_color: '#7c3aed',
        background_color: '#fce4ec',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/sparkle-app/',
        start_url: '/sparkle-app/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
})
