import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// IMPORTANT: 'sparkle-app' must match your exact GitHub repository name.
// GitHub Pages serves from https://<username>.github.io/<repo-name>/
export default defineConfig({
  plugins: [react()],
  base: '/sparkle-app/',
})
