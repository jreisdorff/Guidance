import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      // Multi-page: the app at "/" (index.html) and the marketing page at
      // "/landing" (landing.html). cleanUrls (vercel.json) drops the extension.
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        landing: resolve(import.meta.dirname, 'landing.html'),
      },
    },
  },
  server: {
    proxy: {
      // Forward API calls to the local affirmation backend (server/index.js)
      '/api': 'http://localhost:8787',
    },
  },
})
