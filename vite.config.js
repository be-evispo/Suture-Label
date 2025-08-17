// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'   // ✅ ESM-safe path helper

export default defineConfig({
  plugins: [react()],
  base: '/Suture-Label/',                       // 👈 your repo name for GitHub Pages
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)), // ✅ "@/..." -> /src
    },
  },
})
